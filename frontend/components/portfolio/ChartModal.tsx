"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, useRef, MouseEvent, useMemo } from "react";

type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type ChartType = "candlestick" | "line" | "area" | "ohlc";
type TimeRange = "1D" | "5D" | "1M" | "3M" | "1Y" | "5Y";

type HoverData = {
    candle: Candle;
    x: number;
    y: number;
    index: number;
} | null;

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
    const [zoom, setZoom] = useState(1);
    const [hoverData, setHoverData] = useState<HoverData>(null);
    const chartScrollRef = useRef<HTMLDivElement>(null);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const chartHeight = 400;
    const chartRenderHeight = Math.max(chartHeight, chartHeight * zoom);

    const chartWidth = useMemo(() => {
        if (candles.length === 0) return 1000;
        if (chartType === "line" || chartType === "area") {
            return 1000 * zoom;
        }
        return Math.max(1000, candles.length * 12 * zoom);
    }, [candles.length, chartType, zoom]);

    useEffect(() => {
        const el = chartScrollRef.current;
        if (!el) return;

        const updateMetrics = () => {
            setScrollLeft(el.scrollLeft);
            setContainerWidth(el.clientWidth);
        };

        updateMetrics();
        el.addEventListener("scroll", updateMetrics, { passive: true });
        window.addEventListener("resize", updateMetrics);

        return () => {
            el.removeEventListener("scroll", updateMetrics);
            window.removeEventListener("resize", updateMetrics);
        };
    }, [candles.length, chartType, zoom]);

    const visibleRange = useMemo(() => {
        if (candles.length === 0 || containerWidth === 0) return { start: 0, end: Math.max(0, candles.length - 1) };

        const startX = scrollLeft;
        const endX = scrollLeft + containerWidth;

        if (chartType === "line" || chartType === "area") {
            const maxIndex = candles.length - 1;
            const startIndex = Math.max(0, Math.floor((startX / chartWidth) * maxIndex));
            const endIndex = Math.min(maxIndex, Math.ceil((endX / chartWidth) * maxIndex));
            return { start: startIndex, end: endIndex };
        }

        if (chartType === "ohlc") {
            const barWidth = Math.max(10, (chartWidth / candles.length) * 0.8);
            const spacing = Math.max(2, (chartWidth / candles.length) * 0.2);
            const step = barWidth + spacing;
            const startIndex = Math.max(0, Math.floor(startX / step));
            const endIndex = Math.min(candles.length - 1, Math.ceil(endX / step));
            return { start: startIndex, end: endIndex };
        }

        const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.7);
        const spacing = Math.max(1, (chartWidth / candles.length) * 0.3);
        const step = candleWidth + spacing;
        const startIndex = Math.max(0, Math.floor(startX / step));
        const endIndex = Math.min(candles.length - 1, Math.ceil(endX / step));
        return { start: startIndex, end: endIndex };
    }, [candles, chartType, chartWidth, containerWidth, scrollLeft]);

    const visibleCandles = useMemo(() => {
        if (candles.length === 0) return [] as Candle[];
        const slice = candles.slice(visibleRange.start, visibleRange.end + 1);
        return slice.length > 0 ? slice : candles;
    }, [candles, visibleRange]);

    const visiblePriceStats = useMemo(() => {
        const source = visibleCandles.length > 0 ? visibleCandles : candles;
        if (source.length === 0) return { min: 0, max: 1 };
        const prices = source.flatMap((c) => [c.open, c.high, c.low, c.close]);
        const baseMin = Math.min(...prices);
        const baseMax = Math.max(...prices);
        const baseRange = baseMax - baseMin || 1;

        // Vertical zoom based on zoom factor
        const scaledRange = baseRange / zoom;
        const mid = (baseMax + baseMin) / 2;
        const min = mid - scaledRange / 2;
        const max = mid + scaledRange / 2;

        return { min, max };
    }, [candles, visibleCandles, zoom]);

    const priceLines = useMemo(() => {
        if (candles.length === 0) return [] as { price: number; y: number }[];
        const range = visiblePriceStats.max - visiblePriceStats.min || 1;
        const priceSteps = 5;
        return Array.from({ length: priceSteps + 1 }, (_, i) => {
            const price = visiblePriceStats.min + (range * i / priceSteps);
            const y = chartHeight - ((price - visiblePriceStats.min) / range) * chartHeight;
            return { price, y };
        });
    }, [candles, visiblePriceStats]);

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
                console.log(`Received ${data.candles?.length || 0} candles for ${timeRange}`);
                setCandles(data.candles || []);
                setPrice(data.price);
            } catch (err) {
                console.error("Failed to fetch chart data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChartData();
        setZoom(1);
    }, [symbol, isOpen, timeRange]);

    if (!isOpen) return null;

    const chartTypes: { value: ChartType; label: string }[] = [
        { value: "candlestick", label: "Candle" },
        { value: "line", label: "Line" },
        { value: "area", label: "Area" },
        { value: "ohlc", label: "OHLC" },
    ];

    const timeRanges: TimeRange[] = ["1D", "5D", "1M", "3M", "1Y", "5Y"];

    const handleZoom = (delta: number) => {
        setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
        const now = new Date();
        const isCurrentYear = date.getFullYear() === now.getFullYear();

        // Show year if not current year
        if (!isCurrentYear) {
            return date.toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }

        // For current year, show time if available (for intraday data)
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
        if (hasTime) {
            return date.toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // For daily data in current year, just show date
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
    };

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
                            {hoverData ? (
                                <div className="flex gap-4 text-sm mt-2">
                                    <span className="text-white/60">O: <span className="text-white">₹{hoverData.candle.open.toFixed(2)}</span></span>
                                    <span className="text-white/60">H: <span className="text-emerald-400">₹{hoverData.candle.high.toFixed(2)}</span></span>
                                    <span className="text-white/60">L: <span className="text-red-400">₹{hoverData.candle.low.toFixed(2)}</span></span>
                                    <span className="text-white/60">C: <span className="text-white">₹{hoverData.candle.close.toFixed(2)}</span></span>
                                    <span className="text-white/40">|</span>
                                    <span className="text-white/60">{formatDate(hoverData.candle.time)}</span>
                                </div>
                            ) : (
                                <p className="text-2xl text-white/80 mt-2">
                                    {price ? `₹${price.toFixed(2)}` : "—"}
                                </p>
                            )}
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

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => handleZoom(-0.2)}
                                className="px-3 py-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-md text-sm font-medium"
                            >
                                −
                            </button>
                            <span className="text-white/60 text-sm px-2">{(zoom * 100).toFixed(0)}%</span>
                            <button
                                onClick={() => handleZoom(0.2)}
                                className="px-3 py-2 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-md text-sm font-medium"
                            >
                                +
                            </button>
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
                        <div className="h-[500px] flex items-center justify-center text-white/50">
                            Loading chart data...
                        </div>
                    ) : candles.length > 0 ? (
                        <div className="relative h-[500px] bg-[#000000] border border-white/5 rounded-xl">
                            {/* Fixed overlay grid + labels (do not move on zoom/scroll) */}
                            <div className="absolute inset-4 pointer-events-none">
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox={`0 0 1000 ${chartHeight}`}
                                    preserveAspectRatio="none"
                                >
                                    {Array.from({ length: 7 }, (_, i) => (
                                        <line
                                            key={`v-${i}`}
                                            x1={(1000 / 6) * i}
                                            y1={0}
                                            x2={(1000 / 6) * i}
                                            y2={chartHeight}
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="1"
                                        />
                                    ))}
                                    {priceLines.map((line, i) => (
                                        <g key={i}>
                                            <line
                                                x1={0}
                                                y1={line.y}
                                                x2={1000}
                                                y2={line.y}
                                                stroke="rgba(255,255,255,0.08)"
                                                strokeWidth="1"
                                            />
                                            <text
                                                x={990}
                                                y={line.y - 3}
                                                fill="rgba(255,255,255,0.5)"
                                                fontSize="10"
                                                textAnchor="end"
                                            >
                                                ₹{line.price.toFixed(2)}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            {/* Scrollable chart content */}
                            <div
                                ref={chartScrollRef}
                                className={`h-full p-4 overflow-auto ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                                onWheel={(e) => {
                                    e.preventDefault();
                                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                                    handleZoom(delta);
                                }}
                                onMouseDown={(e) => {
                                    const el = chartScrollRef.current;
                                    if (!el) return;
                                    isDraggingRef.current = true;
                                    setIsDragging(true);
                                    dragStartRef.current = {
                                        x: e.clientX,
                                        y: e.clientY,
                                        scrollLeft: el.scrollLeft,
                                        scrollTop: el.scrollTop,
                                    };
                                }}
                                onMouseMove={(e) => {
                                    if (!isDraggingRef.current) return;
                                    const el = chartScrollRef.current;
                                    if (!el) return;
                                    const dx = e.clientX - dragStartRef.current.x;
                                    const dy = e.clientY - dragStartRef.current.y;
                                    el.scrollLeft = dragStartRef.current.scrollLeft - dx;
                                    el.scrollTop = dragStartRef.current.scrollTop - dy;
                                }}
                                onMouseUp={() => {
                                    isDraggingRef.current = false;
                                    setIsDragging(false);
                                }}
                                onMouseLeave={() => {
                                    isDraggingRef.current = false;
                                    setIsDragging(false);
                                }}
                            >
                                {chartType === "candlestick" && (
                                    <InteractiveCandlestickChart
                                        candles={candles}
                                        width={chartWidth}
                                        height={chartRenderHeight}
                                        minPrice={visiblePriceStats.min}
                                        maxPrice={visiblePriceStats.max}
                                        onHover={setHoverData}
                                    />
                                )}
                                {chartType === "line" && (
                                    <InteractiveLineChart
                                        candles={candles}
                                        width={chartWidth}
                                        height={chartRenderHeight}
                                        minPrice={visiblePriceStats.min}
                                        maxPrice={visiblePriceStats.max}
                                        onHover={setHoverData}
                                    />
                                )}
                                {chartType === "area" && (
                                    <InteractiveAreaChart
                                        candles={candles}
                                        width={chartWidth}
                                        height={chartRenderHeight}
                                        minPrice={visiblePriceStats.min}
                                        maxPrice={visiblePriceStats.max}
                                        onHover={setHoverData}
                                    />
                                )}
                                {chartType === "ohlc" && (
                                    <InteractiveOHLCChart
                                        candles={candles}
                                        width={chartWidth}
                                        height={chartRenderHeight}
                                        minPrice={visiblePriceStats.min}
                                        maxPrice={visiblePriceStats.max}
                                        onHover={setHoverData}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] flex items-center justify-center text-white/50">
                            No chart data available
                        </div>
                    )}

                    <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                        {candles.length > 0 && (
                            <>
                                <div>
                                    <p className="text-white/50">High</p>
                                    <p className="text-emerald-400 font-semibold">₹{Math.max(...candles.map((c) => c.high)).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-white/50">Low</p>
                                    <p className="text-red-400 font-semibold">₹{Math.min(...candles.map((c) => c.low)).toFixed(2)}</p>
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

function InteractiveCandlestickChart({
    candles,
    width,
    height,
    minPrice,
    maxPrice,
    onHover
}: {
    candles: Candle[];
    width: number;
    height: number;
    minPrice: number;
    maxPrice: number;
    onHover: (data: HoverData) => void;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; index: number } | null>(null);

    if (candles.length === 0) return null;

    const range = maxPrice - minPrice || 1;
    const candleWidth = Math.max(3, (width / candles.length) * 0.7);
    const spacing = Math.max(1, (width / candles.length) * 0.3);


    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const svgX = (x / rect.width) * width;
        const svgY = (y / rect.height) * height;

        const candleIndex = Math.floor(svgX / (candleWidth + spacing));
        if (candleIndex >= 0 && candleIndex < candles.length) {
            onHover({ candle: candles[candleIndex], x: svgX, y: svgY, index: candleIndex });
            setMousePos({ x: svgX, y: svgY, index: candleIndex });
        }
    };

    const handleMouseLeave = () => {
        onHover(null);
        setMousePos(null);
    };

    return (
        <svg
            ref={svgRef}
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair" }}
        >
            <defs>
                <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
                </linearGradient>
            </defs>

            {/* Candles */}
            {candles.map((candle, i) => {
                const x = i * (candleWidth + spacing);
                const openY = height - ((candle.open - minPrice) / range) * height;
                const closeY = height - ((candle.close - minPrice) / range) * height;
                const highY = height - ((candle.high - minPrice) / range) * height;
                const lowY = height - ((candle.low - minPrice) / range) * height;

                const isBull = candle.close >= candle.open;
                const topY = Math.min(openY, closeY);
                const bottomY = Math.max(openY, closeY);
                const bodyHeight = Math.max(2, bottomY - topY);

                const isHovered = mousePos?.index === i;

                return (
                    <g key={i} opacity={isHovered ? 1 : 0.85}>
                        <line
                            x1={x + candleWidth / 2}
                            y1={highY}
                            x2={x + candleWidth / 2}
                            y2={lowY}
                            stroke={isBull ? "#10b981" : "#ef4444"}
                            strokeWidth={isHovered ? "2" : "1.5"}
                        />
                        <rect
                            x={x}
                            y={topY}
                            width={candleWidth}
                            height={bodyHeight}
                            fill={isBull ? "url(#bullGrad)" : "url(#bearGrad)"}
                            stroke={isBull ? "#10b981" : "#ef4444"}
                            strokeWidth={isHovered ? "2" : "0.5"}
                            rx="1"
                        />
                    </g>
                );
            })}

            {/* Crosshair and hover point */}
            {mousePos && (
                <>
                    <line
                        x1={mousePos.x}
                        y1={0}
                        x2={mousePos.x}
                        y2={height}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1={0}
                        y1={mousePos.y}
                        x2={width}
                        y2={mousePos.y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    {/* Hover point */}
                    <circle
                        cx={mousePos.x}
                        cy={mousePos.y}
                        r="5"
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="2"
                    />
                </>
            )}
        </svg>
    );
}

function InteractiveLineChart({
    candles,
    width,
    height,
    minPrice,
    maxPrice,
    onHover
}: {
    candles: Candle[];
    width: number;
    height: number;
    minPrice: number;
    maxPrice: number;
    onHover: (data: HoverData) => void;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; index: number } | null>(null);

    if (candles.length === 0) return null;

    const range = maxPrice - minPrice || 1;


    const points = candles.map((candle, i) => {
        const x = (i / (candles.length - 1)) * width;
        const y = height - ((candle.close - minPrice) / range) * height;
        return { x, y };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    const firstClose = candles[0].close;
    const lastClose = candles[candles.length - 1].close;
    const isPositive = lastClose >= firstClose;


    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const svgX = (x / rect.width) * width;
        const svgY = (y / rect.height) * height;

        const candleIndex = Math.round((svgX / width) * (candles.length - 1));
        if (candleIndex >= 0 && candleIndex < candles.length) {
            onHover({ candle: candles[candleIndex], x: svgX, y: svgY, index: candleIndex });
            setMousePos({ x: points[candleIndex].x, y: points[candleIndex].y, index: candleIndex });
        }
    };

    const handleMouseLeave = () => {
        onHover(null);
        setMousePos(null);
    };

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair" }}
        >
            <defs>
                <linearGradient id="lineGradPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="1" />
                    <stop offset="100%" stopColor={isPositive ? "#059669" : "#dc2626"} stopOpacity="0.8" />
                </linearGradient>
            </defs>

            {/* Line path */}
            <path
                d={pathD}
                fill="none"
                stroke="url(#lineGradPro)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, i) => (
                <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={mousePos?.index === i ? "5" : "2"}
                    fill={isPositive ? "#10b981" : "#ef4444"}
                    opacity={mousePos?.index === i ? "1" : "0.6"}
                />
            ))}

            {/* Crosshair and hover point */}
            {mousePos && (
                <>
                    <line
                        x1={mousePos.x}
                        y1={0}
                        x2={mousePos.x}
                        y2={height}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1={0}
                        y1={mousePos.y}
                        x2={width}
                        y2={mousePos.y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <circle
                        cx={mousePos.x}
                        cy={mousePos.y}
                        r="6"
                        fill="#fff"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth="3"
                    />
                </>
            )}
        </svg>
    );
}

function InteractiveAreaChart({
    candles,
    width,
    height,
    minPrice,
    maxPrice,
    onHover
}: {
    candles: Candle[];
    width: number;
    height: number;
    minPrice: number;
    maxPrice: number;
    onHover: (data: HoverData) => void;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; index: number } | null>(null);

    if (candles.length === 0) return null;

    const range = maxPrice - minPrice || 1;


    const points = candles.map((candle, i) => {
        const x = (i / (candles.length - 1)) * width;
        const y = height - ((candle.close - minPrice) / range) * height;
        return { x, y };
    });

    const linePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPathD = `M 0,${height} ${linePathD} L ${width},${height} Z`;

    const firstClose = candles[0].close;
    const lastClose = candles[candles.length - 1].close;
    const isPositive = lastClose >= firstClose;


    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const svgX = (x / rect.width) * width;
        const svgY = (y / rect.height) * height;

        const candleIndex = Math.round((svgX / width) * (candles.length - 1));
        if (candleIndex >= 0 && candleIndex < candles.length) {
            onHover({ candle: candles[candleIndex], x: svgX, y: svgY, index: candleIndex });
            setMousePos({ x: points[candleIndex].x, y: points[candleIndex].y, index: candleIndex });
        }
    };

    const handleMouseLeave = () => {
        onHover(null);
        setMousePos(null);
    };

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair" }}
        >
            <defs>
                <linearGradient id="areaFillPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={isPositive ? "#059669" : "#dc2626"} stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="areaStrokePro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="1" />
                    <stop offset="100%" stopColor={isPositive ? "#059669" : "#dc2626"} stopOpacity="0.8" />
                </linearGradient>
            </defs>

            {/* Area */}
            <path d={areaPathD} fill="url(#areaFillPro)" />

            {/* Line */}
            <path
                d={linePathD}
                fill="none"
                stroke="url(#areaStrokePro)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Crosshair and hover point */}
            {mousePos && (
                <>
                    <line
                        x1={mousePos.x}
                        y1={0}
                        x2={mousePos.x}
                        y2={height}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1={0}
                        y1={mousePos.y}
                        x2={width}
                        y2={mousePos.y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <circle
                        cx={mousePos.x}
                        cy={mousePos.y}
                        r="6"
                        fill="#fff"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth="3"
                    />
                </>
            )}
        </svg>
    );
}

function InteractiveOHLCChart({
    candles,
    width,
    height,
    minPrice,
    maxPrice,
    onHover
}: {
    candles: Candle[];
    width: number;
    height: number;
    minPrice: number;
    maxPrice: number;
    onHover: (data: HoverData) => void;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; index: number } | null>(null);

    if (candles.length === 0) return null;

    const range = maxPrice - minPrice || 1;
    const barWidth = Math.max(10, (width / candles.length) * 0.8);
    const spacing = Math.max(2, (width / candles.length) * 0.2);


    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const svgX = (x / rect.width) * width;
        const svgY = (y / rect.height) * height;

        const candleIndex = Math.floor(svgX / (barWidth + spacing));
        if (candleIndex >= 0 && candleIndex < candles.length) {
            const x = candleIndex * (barWidth + spacing) + barWidth / 2;
            onHover({ candle: candles[candleIndex], x: svgX, y: svgY, index: candleIndex });
            setMousePos({ x, y: svgY, index: candleIndex });
        }
    };

    const handleMouseLeave = () => {
        onHover(null);
        setMousePos(null);
    };

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair" }}
        >
            {/* OHLC bars */}
            {candles.map((candle, i) => {
                const x = i * (barWidth + spacing) + barWidth / 2;
                const openY = height - ((candle.open - minPrice) / range) * height;
                const closeY = height - ((candle.close - minPrice) / range) * height;
                const highY = height - ((candle.high - minPrice) / range) * height;
                const lowY = height - ((candle.low - minPrice) / range) * height;

                const isBull = candle.close >= candle.open;
                const color = isBull ? "#10b981" : "#ef4444";
                const isHovered = mousePos?.index === i;

                return (
                    <g key={i} opacity={isHovered ? 1 : 0.85}>
                        <line
                            x1={x}
                            y1={highY}
                            x2={x}
                            y2={lowY}
                            stroke={color}
                            strokeWidth={isHovered ? "3" : "2"}
                        />
                        <line
                            x1={x - barWidth / 3}
                            y1={openY}
                            x2={x}
                            y2={openY}
                            stroke={color}
                            strokeWidth={isHovered ? "3" : "2"}
                        />
                        <line
                            x1={x}
                            y1={closeY}
                            x2={x + barWidth / 3}
                            y2={closeY}
                            stroke={color}
                            strokeWidth={isHovered ? "3" : "2"}
                        />
                    </g>
                );
            })}

            {/* Crosshair and hover point */}
            {mousePos && (
                <>
                    <line
                        x1={mousePos.x}
                        y1={0}
                        x2={mousePos.x}
                        y2={height}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <line
                        x1={0}
                        y1={mousePos.y}
                        x2={width}
                        y2={mousePos.y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <circle
                        cx={mousePos.x}
                        cy={mousePos.y}
                        r="5"
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="2"
                    />
                </>
            )}
        </svg>
    );
}
