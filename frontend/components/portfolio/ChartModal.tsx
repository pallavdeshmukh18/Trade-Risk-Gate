"use client";

import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";
import { formatPrice, getCurrency } from "@/lib/currency-utils";
import GlassCard from "@/components/ui/GlassCard";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, AreaSeries, BarSeries, UTCTimestamp } from "lightweight-charts";

// Blocked symbols (international stocks)
const BLOCKED_SYMBOLS = new Set([
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "INTC",
    "JPM", "BAC", "WFC", "V", "MA", "WMT", "DIS", "COCA", "PEP", "MCD",
    "^GSPC", "^DJI", "^IXIC"
]);

function isBlocked(symbol: string): boolean {
    return BLOCKED_SYMBOLS.has(symbol.toUpperCase());
}

type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type ChartType = "candlestick" | "line" | "area" | "bar";
type TimeRange = "1D" | "5D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";

type PortfolioPosition = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
};

type RiskPosition = {
    symbol: string;
    quantity: number;
    prices: number[];
};

type TradeImpact = {
    beforeRisk: number;
    afterRisk: number;
    delta: number;
    warning: string;
};

type Prediction = {
    lossProbability: number;
    prediction: "HIGH_RISK" | "LOW_RISK";
};

type ChartModalProps = {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
    onTradeSuccess?: () => void;
};

function sanitizePrices(prices: number[]) {
    return prices.filter((value) => Number.isFinite(value));
}

function buildRiskPositions(
    positions: PortfolioPosition[],
    selectedSymbol: string,
    currentPrices: number[]
): RiskPosition[] {
    const selectedPrices = sanitizePrices(currentPrices);

    return positions
        .filter((pos) => pos.quantity > 0)
        .map((pos) => {
            const fallbackPrices = sanitizePrices([pos.avgEntryPrice, pos.currentPrice]);
            return {
                symbol: pos.symbol,
                quantity: pos.quantity,
                prices: pos.symbol === selectedSymbol && selectedPrices.length >= 2
                    ? selectedPrices
                    : fallbackPrices,
            };
        })
        .filter((pos) => pos.prices.length >= 2);
}

function buildProjectedPositions(
    positions: RiskPosition[],
    trade: { symbol: string; quantity: number; prices: number[] }
) {
    const sanitizedTradePrices = sanitizePrices(trade.prices);
    const projected = positions.map((pos) => ({ ...pos, prices: [...pos.prices] }));
    const existing = projected.find((pos) => pos.symbol === trade.symbol);

    if (existing) {
        existing.quantity += trade.quantity;
        if (sanitizedTradePrices.length >= 2) {
            existing.prices = sanitizedTradePrices;
        }
    } else if (sanitizedTradePrices.length >= 2) {
        projected.push({
            symbol: trade.symbol,
            quantity: trade.quantity,
            prices: sanitizedTradePrices,
        });
    }

    return projected.filter((pos) => pos.quantity > 0 && pos.prices.length >= 2);
}

export default function ChartModal({ symbol, isOpen, onClose, onTradeSuccess }: ChartModalProps) {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();

    // Check if symbol is blocked
    const isBlockedSymbol = isBlocked(symbol);

    // Trade State
    const [positions, setPositions] = useState<PortfolioPosition[]>([]);
    const [quantity, setQuantity] = useState<number>(0);
    const [isTrading, setIsTrading] = useState(false);
    const [tradeError, setTradeError] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    const [impact, setImpact] = useState<TradeImpact | null>(null);
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [loading, setLoading] = useState(false);
    const [candles, setCandles] = useState<Candle[]>([]);
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chartType, setChartType] = useState<ChartType>("candlestick");
    const [timeRange, setTimeRange] = useState<TimeRange>("1D");
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!isOpen || isBlockedSymbol) return;

        const fetchChartData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/ml/chart?symbol=${symbol}&range=${timeRange}`);
                const data = await response.json();
                setCandles(data.candles || []);
                setPrice(data.price);
            } catch (err) {
                console.error("Failed to fetch chart data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChartData();
    }, [symbol, isOpen, timeRange, isBlockedSymbol]);

    useEffect(() => {
        if (!isOpen || !token) return;

        const loadPositions = async () => {
            try {
                const portfolioPositions = await fetchWithAuth("/portfolio/positions");
                setPositions(Array.isArray(portfolioPositions) ? portfolioPositions : []);
            } catch (err) {
                console.error("Failed to fetch positions for trade analysis:", err);
                setPositions([]);
            }
        };

        loadPositions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, token]);

    // Initialize and update chart
    useEffect(() => {
        if (!chartContainerRef.current || candles.length === 0) return;

        // Use a small delay to ensure DOM is fully rendered
        const timer = setTimeout(() => {
            try {
                // Clean up old chart
                if (chartRef.current) {
                    chartRef.current.remove();
                    chartRef.current = null;
                }

                const container = chartContainerRef.current;
                if (!container) return;

                // Ensure container has proper dimensions
                const rect = container.getBoundingClientRect();
                const width = rect.width > 0 ? rect.width : 800;
                const height = rect.height > 0 ? rect.height : 500;

                // Create new chart with explicit type checking
                let chart: IChartApi;
                try {
                    chart = createChart(container, {
                        layout: {
                            background: { type: ColorType.Solid, color: "#0a0a0a" },
                            textColor: "#d1d5db",
                            fontSize: 12,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        },
                        width: width,
                        height: height,
                        timeScale: {
                            timeVisible: true,
                            secondsVisible: false,
                            borderColor: "#ffffff0d",
                        },
                        rightPriceScale: {
                            borderColor: "#ffffff0d",
                            textColor: "#9ca3af",
                        },
                        grid: {
                            hLineColor: "#ffffff0d",
                            vLineColor: "#ffffff0d",
                        },
                    });
                } catch (createError) {
                    console.error("Error creating chart instance:", createError);
                    return;
                }

                chartRef.current = chart;

                // Format candles for the chart
                const formattedCandles = candles.map((c) => ({
                    time: Math.floor(c.time / 1000) as UTCTimestamp,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                }));

                // Add appropriate series based on chart type
                try {
                    if (chartType === "candlestick") {
                        const candleStickSeries = chart.addSeries(CandlestickSeries, {
                            upColor: "#10b981",
                            downColor: "#ef4444",
                            borderVisible: true,
                            wickUpColor: "#10b981",
                            wickDownColor: "#ef4444",
                        });

                        candleStickSeries.setData(formattedCandles);
                        chart.timeScale().fitContent();
                    } else if (chartType === "bar") {
                        const barSeries = chart.addSeries(BarSeries, {
                            upColor: "#10b981",
                            downColor: "#ef4444",
                        });

                        barSeries.setData(formattedCandles);
                        chart.timeScale().fitContent();
                    } else if (chartType === "line") {
                        const lineSeries = chart.addSeries(LineSeries, {
                            color: "#3b82f6",
                            lineWidth: 2,
                        });

                        const lineCandles = formattedCandles.map((c) => ({
                            time: c.time,
                            value: c.close,
                        }));

                        lineSeries.setData(lineCandles);
                        chart.timeScale().fitContent();
                    } else if (chartType === "area") {
                        const areaSeries = chart.addSeries(AreaSeries, {
                            lineColor: "#10b981",
                            topColor: "#10b98133",
                            bottomColor: "#10b98105",
                            lineWidth: 2,
                        });

                        const areaCandles = formattedCandles.map((c) => ({
                            time: c.time,
                            value: c.close,
                        }));

                        areaSeries.setData(areaCandles);
                        chart.timeScale().fitContent();
                    }
                } catch (seriesError) {
                    console.error("Error adding series:", seriesError);
                    return;
                }

                // Handle window resize
                const handleResize = () => {
                    if (chartContainerRef.current && chartRef.current) {
                        chartRef.current.applyOptions({
                            width: chartContainerRef.current.clientWidth,
                        });
                    }
                };

                window.addEventListener("resize", handleResize);

                return () => {
                    window.removeEventListener("resize", handleResize);
                };
            } catch (error) {
                console.error("Error in chart initialization:", error);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [candles, chartType]);

    const handleTrade = async (side: "BUY" | "SELL") => {
        if (!price || quantity < 1) return;
        setIsTrading(true);
        setTradeError(null);

        try {
            await fetchWithAuth("/paper/place-order", {
                method: "POST",
                body: JSON.stringify({
                    symbol,
                    quantity,
                    side, // "BUY" or "SELL" matches backend schema
                    atp: price,
                }),
            });

            if (onTradeSuccess) onTradeSuccess();
            onClose();
        } catch (err) {
            setTradeError(err instanceof Error ? err.message : "Trade failed");
        } finally {
            setIsTrading(false);
        }
    };

    const analyzeTrade = useCallback(async (qty: number, signal: AbortSignal) => {
        const currentPrices = sanitizePrices(candles.map((c) => c.close));

        if (!isOpen || !symbol || qty < 1 || currentPrices.length < 2) {
            setLoading(false);
            return;
        }

        const normalizedPositions = buildRiskPositions(positions, symbol, currentPrices);
        const trade = {
            symbol,
            quantity: qty,
            prices: currentPrices,
        };
        const projectedPositions = buildProjectedPositions(normalizedPositions, trade);

        if (projectedPositions.length === 0) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setAnalysisError(null);
            setPredictionError(null);

            const [impactRes, predRes] = await Promise.all([
                fetch(`/api/ml/trade-impact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        positions: normalizedPositions,
                        trade,
                    }),
                    signal,
                }),
                fetch(`/api/ml/predict-risk`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        positions: projectedPositions,
                    }),
                    signal,
                }),
            ]);

            const [impactData, predData] = await Promise.all([
                impactRes.json().catch(() => ({})),
                predRes.json().catch(() => ({})),
            ]);

            if (!impactRes.ok) {
                throw new Error(
                    typeof impactData?.error === "string"
                        ? impactData.error
                        : "Trade impact analysis failed"
                );
            }

            setImpact(impactData);

            if (!predRes.ok) {
                setPredictionError(
                    typeof predData?.error === "string"
                        ? predData.error
                        : "Prediction unavailable"
                );
                return;
            }

            setPrediction(predData);
            setPredictionError(null);
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                return;
            }

            console.error("Trade analysis failed:", err);
            setAnalysisError(err instanceof Error ? err.message : "Trade analysis failed");
            setPredictionError(null);
        } finally {
            setLoading(false);
        }
    }, [candles, isOpen, positions, symbol]);

    useEffect(() => {
        if (!isOpen) return;
        if (!quantity || quantity <= 0) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void analyzeTrade(quantity, controller.signal);
        }, 500);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [analyzeTrade, isOpen, quantity]);

    // Listen for Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Lock background scroll
            setTradeError(null);
            setAnalysisError(null);
            setPredictionError(null);
            setQuantity(0);
        } else {
            document.body.style.overflow = "unset"; // Unlock
            setImpact(null);
            setPrediction(null);
            setPredictionError(null);
            setLoading(false);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Show error if stock is blocked (international)
    if (isBlockedSymbol) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GlassCard innerClassName="space-y-6 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white text-lg font-semibold">Market Restriction</h2>
                            <button
                                onClick={onClose}
                                className="text-white/60 hover:text-white transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-white/80">
                                <span className="text-lg font-bold text-rose-400">{symbol}</span> is not available in the Indian market.
                            </p>
                            <p className="text-gray-400 text-sm">
                                LowkeyLoss is restricted to NSE/BSE stocks only. Only Indian market symbols are supported.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded transition text-sm"
                        >
                            Close
                        </button>
                    </GlassCard>
                </motion.div>
            </motion.div>
        );
    }

    const chartTypes: { value: ChartType; label: string }[] = [
        { value: "candlestick", label: "Candlestick" },
        { value: "bar", label: "Bar" },
        { value: "line", label: "Line" },
        { value: "area", label: "Area" },
    ];

    const timeRanges: TimeRange[] = ["1D", "5D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-7xl"
                onClick={(e) => e.stopPropagation()}
            >
                <GlassCard innerClassName="overflow-hidden p-0 flex flex-col max-h-[95vh]">
                {/* Fixed Header */}
                <div className="border-b border-white/10 bg-white/[0.02]">
                    {/* Top Title Bar */}
                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-white">{symbol}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/70">NSE</span>
                            </div>
                            {price && (
                                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                                    <div className={`text-xl font-mono font-semibold ${price > (candles[candles.length - 2]?.close || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatPrice(price, symbol)}
                                    </div>
                                    <div className={`text-sm font-semibold ${price > (candles[candles.length - 2]?.close || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {((price - (candles[candles.length - 2]?.close || 0)) / (candles[candles.length - 2]?.close || 1) * 100).toFixed(2)}%
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Type</span>
                            <div className="flex gap-1">
                                {chartTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setChartType(type.value)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded transition ${chartType === type.value
                                            ? "bg-emerald-500 text-white"
                                            : "text-white/60 hover:text-white/90 hover:bg-white/10"
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeframes Bar */}
                    <div className="flex items-center gap-2 px-6 py-2.5 border-t border-white/5 bg-white/[0.01]">
                        {timeRanges.map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded transition ${timeRange === range
                                    ? "bg-emerald-500 text-white"
                                    : "text-white/60 hover:text-white/90 hover:bg-white/10"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid - Chart + Right Panel */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Chart Area - Left Side */}
                    <div className="flex-1 overflow-hidden border-r border-white/10">
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                                <div className="text-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-emerald-400 animate-spin mx-auto mb-3"></div>
                                    Loading chart...
                                </div>
                            </div>
                        ) : candles.length > 0 ? (
                            <div
                                ref={chartContainerRef}
                                style={{ width: "100%", height: "100%", display: "block" }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                                No chart data available
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Trading Form & Info */}
                    <div className="w-80 border-l border-white/10 flex flex-col overflow-hidden bg-white/[0.01]">
                        {/* Statistics */}
                        <div className="px-4 py-3 border-b border-white/5">
                            {candles.length > 0 && (
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Open</span>
                                        <span className="text-white/90 font-mono">{formatPrice(candles[0]?.open || 0, symbol)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-emerald-400">High</span>
                                        <span className="text-white/90 font-mono">{formatPrice(Math.max(...candles.map((c) => c.high)), symbol)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-rose-400">Low</span>
                                        <span className="text-white/90 font-mono">{formatPrice(Math.min(...candles.map((c) => c.low)), symbol)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Close</span>
                                        <span className="text-white/90 font-mono">{formatPrice(candles[candles.length - 1]?.close || 0, symbol)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                                        <span className="text-white/60">Volume</span>
                                        <span className="text-white/90 font-mono">{(candles[candles.length - 1].volume / 1_000_000).toFixed(2)}M</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Trading Panel */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {/* Trading Form */}
                            <div className="p-8 space-y-6 border-b border-white/5 opacity-0 animate-fadeInUp transition-all duration-300 ease-out">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trade</h3>

                                <div>
                                    <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide font-semibold">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            setQuantity(Number(e.target.value));
                                        }}
                                        className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all duration-300 ease-out focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>

                                {loading && (
                                    <div className="mt-3 text-sm text-gray-400 animate-pulse transition-all duration-300 ease-out">
                                        analyzing trade...
                                    </div>
                                )}

                                {analysisError && (
                                    <p className="text-rose-400 text-xs font-medium bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2">
                                        {analysisError}
                                    </p>
                                )}

                                {predictionError && (
                                    <p className="text-amber-300 text-xs font-medium bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
                                        {predictionError}
                                    </p>
                                )}

                                {impact && (
                                    <GlassCard
                                        className="mt-4 opacity-0 animate-fadeInUp transition-all duration-300 ease-out"
                                        innerClassName={`space-y-3 p-6 transition-all duration-300 ease-out ${impact.delta > 0 ? "shadow-2xl shadow-red-500/20" : "shadow-2xl shadow-green-500/20"}`}
                                    >
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-gray-400 text-sm">Risk Change</p>
                                                    <p className={`text-white text-lg font-bold ${impact.delta > 0 ? "text-red-400" : "text-green-400"}`}>
                                                        {impact.delta > 0 ? "+" : ""}
                                                        {impact.delta.toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-400 text-sm">Before</p>
                                                        <p className="text-white text-lg font-bold">{impact.beforeRisk.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-sm">After</p>
                                                        <p className="text-white text-lg font-bold">{impact.afterRisk.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-gray-400 text-sm">Risk Signal</p>
                                                    <p className={`text-sm font-semibold ${impact.delta > 0 ? "text-red-400" : "text-green-400"}`}>
                                                        {impact.warning}
                                                    </p>
                                                </div>
                                            </div>
                                    </GlassCard>
                                )}

                                {prediction && (
                                    <GlassCard
                                        className="mt-3 opacity-0 animate-fadeInUp transition-all duration-300 ease-out"
                                        innerClassName={`space-y-2 p-6 transition-all duration-300 ease-out ${prediction.prediction === "HIGH_RISK" ? "shadow-2xl shadow-red-500/20 animate-pulse" : "shadow-2xl shadow-green-500/20"}`}
                                    >
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-gray-400 text-sm">Loss Probability</p>
                                                    <p className="text-white text-lg font-bold">
                                                        {prediction.lossProbability.toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className={`text-3xl font-bold ${prediction.prediction === "HIGH_RISK" ? "text-red-400" : "text-green-400"}`}>
                                                        {prediction.prediction === "HIGH_RISK"
                                                            ? "⚠️ lowkeyloss"
                                                            : "✅ safe trade"}
                                                    </p>
                                                    <p className={`text-sm font-semibold ${prediction.prediction === "HIGH_RISK" ? "text-red-400" : "text-green-400"}`}>
                                                        {prediction.prediction === "HIGH_RISK" ? "Elevated downside signal detected" : "Model confidence supports this trade"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-gray-400 text-sm">ML Classification</p>
                                                    <p className={`text-sm font-semibold ${prediction.prediction === "HIGH_RISK" ? "text-red-400" : "text-green-400"}`}>
                                                        {prediction.prediction}
                                                    </p>
                                                </div>
                                            </div>
                                    </GlassCard>
                                )}

                                <button
                                    onClick={() => handleTrade("BUY")}
                                    disabled={isTrading || !price || quantity < 1}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded transition text-sm"
                                >
                                    {isTrading ? "Processing..." : "BUY"}
                                </button>

                                <button
                                    onClick={() => handleTrade("SELL")}
                                    disabled={isTrading || !price || quantity < 1}
                                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded transition text-sm"
                                >
                                    {isTrading ? "Processing..." : "SELL"}
                                </button>

                                {tradeError && (
                                    <p className="text-rose-400 text-xs font-medium bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2">
                                        {tradeError}
                                    </p>
                                )}
                            </div>

                            {/* Additional Info Panels */}
                            <div className="p-8 space-y-6 opacity-0 animate-fadeInUp transition-all duration-300 ease-out">
                                <GlassCard className="animate-fadeInUp transition-all duration-300 ease-out" innerClassName="space-y-2 p-6">
                                    <h4 className="text-white text-lg font-semibold">Position Limits</h4>
                                    <div className="text-xs space-y-1.5">
                                        <div className="flex justify-between"><span className="text-white/60">Max Qty</span><span className="text-white/90">100</span></div>
                                        <div className="flex justify-between"><span className="text-white/60">Min Order</span><span className="text-white/90">{getCurrency(symbol).symbol}500</span></div>
                                    </div>
                                </GlassCard>

                                <GlassCard className="animate-fadeInUp transition-all duration-300 ease-out" innerClassName="space-y-2 p-6">
                                    <h4 className="text-white text-lg font-semibold">Market Info</h4>
                                    <div className="text-xs space-y-1.5">
                                        <div className="flex justify-between"><span className="text-white/60">Status</span><span className="text-emerald-400">Open</span></div>
                                        <div className="flex justify-between"><span className="text-white/60">52W High</span><span className="text-white/90">N/A</span></div>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </div>
                </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
