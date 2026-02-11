"use client";

import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";
import { formatPrice, getCurrency } from "@/lib/currency-utils";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, AreaSeries, BarSeries } from "lightweight-charts";

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

type ChartModalProps = {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
    onTradeSuccess?: () => void;
};

export default function ChartModal({ symbol, isOpen, onClose, onTradeSuccess }: ChartModalProps) {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();

    // Check if symbol is blocked
    const isBlockedSymbol = isBlocked(symbol);

    // Trade State
    const [quantity, setQuantity] = useState<number>(1);
    const [isTrading, setIsTrading] = useState(false);
    const [tradeError, setTradeError] = useState<string | null>(null);
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
                console.log(`Fetching data for ${symbol} with range ${timeRange}`);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chart/data?symbol=${symbol}&range=${timeRange}`
                );
                const data = await response.json();
                console.log(`Received ${data.candles?.length || 0} candles for ${timeRange}`, data);
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

    // Initialize and update chart
    useEffect(() => {
        if (!chartContainerRef.current || candles.length === 0) return;

        // Use a small delay to ensure DOM is fully rendered
        const timer = setTimeout(() => {
            try {
                console.log(`Initializing ${chartType} chart with ${candles.length} candles`);

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

                console.log(`Chart container dimensions: ${width}x${height}`);

                // Create new chart with explicit type checking
                let chart: any;
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
                        } as any,
                    });
                } catch (createError) {
                    console.error("Error creating chart instance:", createError);
                    return;
                }

                if (!chart) {
                    console.error("Chart instance is null/undefined");
                    return;
                }

                console.log("Chart created successfully");
                chartRef.current = chart;

                // Format candles for the chart
                const formattedCandles = candles.map((c) => ({
                    time: Math.floor(c.time / 1000) as any,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                }));

                // Add appropriate series based on chart type
                try {
                    if (chartType === "candlestick") {
                        console.log("Adding candlestick series");
                        const candleStickSeries = chart.addSeries(CandlestickSeries, {
                            upColor: "#10b981",
                            downColor: "#ef4444",
                            borderVisible: true,
                            wickUpColor: "#10b981",
                            wickDownColor: "#ef4444",
                        });

                        candleStickSeries.setData(formattedCandles);
                        chart.timeScale().fitContent();
                        console.log("Candlestick series added successfully");
                    } else if (chartType === "bar") {
                        console.log("Adding bar series");
                        const barSeries = chart.addSeries(BarSeries, {
                            upColor: "#10b981",
                            downColor: "#ef4444",
                        });

                        barSeries.setData(formattedCandles);
                        chart.timeScale().fitContent();
                        console.log("Bar series added successfully");
                    } else if (chartType === "line") {
                        console.log("Adding line series");
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
                        console.log("Line series added successfully");
                    } else if (chartType === "area") {
                        console.log("Adding area series");
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
                        console.log("Area series added successfully");
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
        if (!price) return;
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
            setQuantity(1);
        } else {
            document.body.style.overflow = "unset"; // Unlock
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
                    className="bg-[#14161F] rounded-xl border border-white/10 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Market Restriction</h2>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-white/80">
                            <span className="text-lg font-bold text-rose-400">{symbol}</span> is not available in the Indian market.
                        </p>
                        <p className="text-white/60 text-sm">
                            Trade-Risk-Gate is restricted to NSE/BSE stocks only. Only Indian market symbols are supported.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded transition text-sm"
                    >
                        Close
                    </button>
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
                className="bg-[#14161F] w-full max-w-7xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
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
                            <div className="p-4 space-y-4 border-b border-white/5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trade</h3>

                                <div>
                                    <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide font-semibold">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                                    />
                                </div>

                                <button
                                    onClick={() => handleTrade("BUY")}
                                    disabled={isTrading || !price}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded transition text-sm"
                                >
                                    {isTrading ? "Processing..." : "BUY"}
                                </button>

                                <button
                                    onClick={() => handleTrade("SELL")}
                                    disabled={isTrading || !price}
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
                            <div className="p-4 space-y-4">
                                <div className="bg-white/[0.05] rounded p-3 border border-white/10">
                                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Position Limits</h4>
                                    <div className="text-xs space-y-1.5">
                                        <div className="flex justify-between"><span className="text-white/60">Max Qty</span><span className="text-white/90">100</span></div>
                                        <div className="flex justify-between"><span className="text-white/60">Min Order</span><span className="text-white/90">{getCurrency(symbol).symbol}500</span></div>
                                    </div>
                                </div>

                                <div className="bg-white/[0.05] rounded p-3 border border-white/10">
                                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Market Info</h4>
                                    <div className="text-xs space-y-1.5">
                                        <div className="flex justify-between"><span className="text-white/60">Status</span><span className="text-emerald-400">Open</span></div>
                                        <div className="flex justify-between"><span className="text-white/60">52W High</span><span className="text-white/90">N/A</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
