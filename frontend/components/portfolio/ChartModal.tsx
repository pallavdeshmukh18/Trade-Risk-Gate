"use client";

import { motion } from "framer-motion";
import LiquidCard from "@/components/dashboard/LiquidCard";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type ChartModalProps = {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
};

export default function ChartModal({ symbol, isOpen, onClose }: ChartModalProps) {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchChartData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chart/data?symbol=${symbol}`
                );
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
    }, [symbol, isOpen]);

    if (!isOpen) return null;

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
                className="w-full max-w-4xl"
            >
                <LiquidCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
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

                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center text-white/50">
                            Loading chart data...
                        </div>
                    ) : candles.length > 0 ? (
                        <div className="h-96 bg-white/5 rounded-lg p-4 overflow-hidden">
                            <CandlestickChart candles={candles} />
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-white/50">
                            No chart data available
                        </div>
                    )}

                    <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                        {candles.length > 0 && (
                            <>
                                <div>
                                    <p className="text-white/50">High</p>
                                    <p className="text-white/85">₹{Math.max(...candles.map((c) => c.high)).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-white/50">Low</p>
                                    <p className="text-white/85">₹{Math.min(...candles.map((c) => c.low)).toFixed(2)}</p>
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
                </LiquidCard>
            </motion.div>
        </motion.div>
    );
}

function CandlestickChart({ candles }: { candles: Candle[] }) {
    if (candles.length === 0) return null;

    const prices = candles.map((c) => c.close);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice || 1;

    const width = Math.max(800, candles.length * 2);
    const height = 300;
    const candleWidth = Math.max(1, width / candles.length * 0.8);
    const spacing = Math.max(0.5, width / candles.length * 0.2);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.6" />
                </linearGradient>
            </defs>

            {candles.map((candle, i) => {
                const x = i * (candleWidth + spacing);
                const openY = height - ((candle.open - minPrice) / range) * height;
                const closeY = height - ((candle.close - minPrice) / range) * height;
                const highY = height - ((candle.high - minPrice) / range) * height;
                const lowY = height - ((candle.low - minPrice) / range) * height;

                const isBull = candle.close >= candle.open;
                const topY = Math.min(openY, closeY);
                const bottomY = Math.max(openY, closeY);
                const bodyHeight = Math.max(1, bottomY - topY);

                return (
                    <g key={i}>
                        {/* Wick */}
                        <line
                            x1={x + candleWidth / 2}
                            y1={highY}
                            x2={x + candleWidth / 2}
                            y2={lowY}
                            stroke={isBull ? "#10b981" : "#ef4444"}
                            strokeWidth="0.5"
                            opacity="0.6"
                        />
                        {/* Body */}
                        <rect
                            x={x}
                            y={topY}
                            width={candleWidth}
                            height={bodyHeight}
                            fill={isBull ? "url(#bullGrad)" : "url(#bearGrad)"}
                            rx="1"
                        />
                    </g>
                );
            })}
        </svg>
    );
}
