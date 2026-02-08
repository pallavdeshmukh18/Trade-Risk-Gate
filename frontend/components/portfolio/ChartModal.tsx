"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, AreaSeries } from "lightweight-charts";

type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type ChartType = "candlestick" | "line" | "area";
type TimeRange = "1D" | "5D" | "1M" | "3M" | "1Y" | "5Y";

type ChartModalProps = {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
};

export default function ChartModal({ symbol, isOpen, onClose }: ChartModalProps) {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chartType, setChartType] = useState<ChartType>("candlestick");
    const [timeRange, setTimeRange] = useState<TimeRange>("1D");
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!isOpen) return;

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
    }, [symbol, isOpen, timeRange]);

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

    if (!isOpen) return null;

    const chartTypes: { value: ChartType; label: string }[] = [
        { value: "candlestick", label: "Candle" },
        { value: "line", label: "Line" },
        { value: "area", label: "Area" },
    ];

    const timeRanges: TimeRange[] = ["1D", "5D", "1M", "3M", "1Y", "5Y"];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{symbol}</h2>
                            <p className="text-2xl text-white/80 mt-2">
                                {price ? `₹${price.toFixed(2)}` : "—"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <X size={24} className="text-white/60" />
                        </button>
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            {chartTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setChartType(type.value)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${chartType === type.value
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            {timeRanges.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${timeRange === range
                                            ? "bg-blue-500/20 text-blue-400"
                                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="h-[500px] flex items-center justify-center text-white/50 bg-[#000000] border border-white/5 rounded-xl">
                            Loading chart data...
                        </div>
                    ) : candles.length > 0 ? (
                        <div className="w-full bg-[#000000] border border-white/5 rounded-xl overflow-hidden" style={{ height: "500px" }}>
                            <div
                                ref={chartContainerRef}
                                style={{ width: "100%", height: "100%", display: "block" }}
                            />
                        </div>
                    ) : (
                        <div className="h-[500px] flex items-center justify-center text-white/50 bg-[#000000] border border-white/5 rounded-xl">
                            No chart data available
                        </div>
                    )}

                    <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                        {candles.length > 0 && (
                            <>
                                <div>
                                    <p className="text-white/50">High</p>
                                    <p className="text-emerald-400 font-semibold">
                                        ₹{Math.max(...candles.map((c) => c.high)).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50">Low</p>
                                    <p className="text-red-400 font-semibold">
                                        ₹{Math.min(...candles.map((c) => c.low)).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50">Volume</p>
                                    <p className="text-white/85">
                                        {(candles[candles.length - 1].volume / 1_000_000).toFixed(2)}M
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50">Data Points</p>
                                    <p className="text-white/85">{candles.length}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
