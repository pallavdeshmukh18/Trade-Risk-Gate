"use client";

import LiquidCard from "@/components/dashboard/LiquidCard";
import ChartModal from "./ChartModal";
import { formatPrice } from "@/lib/currency-utils";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";

// Blocked symbols (international stocks)
const BLOCKED_SYMBOLS = new Set([
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "INTC",
    "JPM", "BAC", "WFC", "V", "MA", "WMT", "DIS", "COCA", "PEP", "MCD",
    "^GSPC", "^DJI", "^IXIC"
]);

function isBlocked(symbol: string): boolean {
    return BLOCKED_SYMBOLS.has(symbol.toUpperCase());
}

type Position = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
    side: "LONG" | "SHORT";
    unrealizedPnL: number;
    exposure: number;
};

export default function PositionsTable() {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();
    const [positions, setPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    const fetchPositions = async () => {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth("/portfolio/positions");
            // Filter to exclude blocked international stocks
            const validPositions = (data || []).filter((pos: Position) => !isBlocked(pos.symbol));
            setPositions(validPositions);
        } catch (err) {
            console.error("Failed to fetch positions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;

        fetchPositions();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchPositions, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const totalExposure = useMemo(
        () => positions.reduce((sum, pos) => sum + Math.abs(pos.currentPrice * pos.quantity), 0),
        [positions]
    );

    const positionsWithExposure = useMemo(
        () =>
            positions.map((pos) => ({
                ...pos,
                exposure:
                    totalExposure > 0
                        ? (Math.abs(pos.currentPrice * pos.quantity) / totalExposure) * 100
                        : 0,
            })),
        [positions, totalExposure]
    );

    return (
        <>
            <LiquidCard className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="text-white/50 bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-left">Symbol</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Avg Price</th>
                            <th className="text-right">Current</th>
                            <th className="text-right">P&L</th>
                            <th className="pr-6 text-right">Exposure</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                                    Loading positions...
                                </td>
                            </tr>
                        ) : positionsWithExposure.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                                    No open positions
                                </td>
                            </tr>
                        ) : (
                            positionsWithExposure.map((pos, i) => (
                                <motion.tr
                                    key={pos.symbol}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                                    onClick={() => setSelectedSymbol(pos.symbol)}
                                >
                                    <td className="px-6 py-4 font-medium text-white">{pos.symbol}</td>
                                    <td className="text-right pr-4">{pos.quantity}</td>
                                    <td className="text-right pr-4">{formatPrice(pos.avgEntryPrice, pos.symbol)}</td>
                                    <td className="text-right pr-4">{formatPrice(pos.currentPrice, pos.symbol)}</td>
                                    <td
                                        className={`text-right pr-4 ${pos.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}
                                    >
                                        {pos.unrealizedPnL >= 0 ? "+" : ""}{formatPrice(pos.unrealizedPnL, pos.symbol)}
                                    </td>
                                    <td className="pr-6 text-right">{pos.exposure.toFixed(1)}%</td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </LiquidCard>

            <ChartModal
                symbol={selectedSymbol || ""}
                isOpen={!!selectedSymbol}
                onClose={() => setSelectedSymbol(null)}
            />
        </>
    );
}
