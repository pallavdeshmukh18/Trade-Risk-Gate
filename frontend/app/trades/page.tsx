"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from "lucide-react";

type Position = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
    side: "LONG" | "SHORT";
    unrealizedPnL: number;
};

type Trade = {
    _id: string;
    symbol: string;
    quantity: number;
    side: "LONG" | "SHORT";
    realizedPnL: number;
    entryPrice: number;
    exitPrice: number;
    exitTime?: string; // This might be exitTime or createdAt depending on backend
    createdAt?: string;
};

type CombinedTrade = {
    id: string;
    symbol: string;
    side: "LONG" | "SHORT";
    quantity: number;
    price: number;
    pnl?: number;
    status: "OPEN" | "CLOSED";
    timestamp: Date;
    type: "ENTRY" | "EXIT";
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
};

export default function TradesPage() {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [positions, setPositions] = useState<Position[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
             if (!token) return;
             setIsLoading(true);
             try {
                const [posRes, tradesRes] = await Promise.all([
                    fetchWithAuth("/portfolio/positions"),
                    fetchWithAuth("/stats/pnl/trades")
                ]);
                setPositions(posRes || []);
                setTrades(tradesRes?.trades || []);
             } catch (err) {
                 console.error("Failed to load trades data", err);
             } finally {
                 setIsLoading(false);
             }
        };
        loadData();
    }, [token]);

    const mixedHistory = useMemo(() => {
        const history: CombinedTrade[] = [];

        // Add Open Positions
        positions.forEach((pos, idx) => {
            history.push({
                id: `pos-${idx}`,
                symbol: pos.symbol,
                side: pos.side,
                quantity: pos.quantity,
                price: pos.avgEntryPrice,
                pnl: pos.unrealizedPnL,
                status: "OPEN",
                timestamp: new Date(), // Using current time for open positions as "active"
                type: "ENTRY"
            });
        });

        // Add Closed Trades
        trades.forEach((trade) => {
             const time = trade.exitTime || trade.createdAt || new Date().toISOString();
             history.push({
                id: trade._id,
                symbol: trade.symbol,
                side: trade.side,
                quantity: trade.quantity,
                price: trade.exitPrice || 0, // Showing exit price for consistency in "history" context
                pnl: trade.realizedPnL,
                status: "CLOSED",
                timestamp: new Date(time),
                type: "EXIT"
             });
        });

        return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [positions, trades]);

    return (
        <ProtectedRoute>
            <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">
               {/* 🌌 Premium Ambient Background */}
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute top-24 left-24 w-[520px] h-[520px] bg-indigo-600/12 blur-[150px]" />
                    <div className="absolute bottom-24 right-24 w-[520px] h-[520px] bg-purple-600/12 blur-[150px]" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>
                 {/* 🧬 Subtle system grid */}
                 <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035]">
                    <svg width="100%" height="100%">
                        <defs>
                            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <Sidebar 
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                <main 
                    className={`relative flex-1 px-10 py-8 space-y-10 transition-all duration-300
                    ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}
                >
                    <TopBar />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white/95 tracking-tight">
                                Orders & Trades
                            </h1>
                            <div className="text-sm text-white/45 mt-2">
                                Combined history of active positions and past executions.
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0E1018] border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
                    >
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white/5 text-white/50 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Symbol</th>
                                        <th className="px-6 py-4 font-semibold">Side</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Qty</th>
                                        <th className="px-6 py-4 font-semibold text-right">Price</th>
                                        <th className="px-6 py-4 font-semibold text-right">P&L</th>
                                        <th className="px-6 py-4 font-semibold text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-white/30">
                                                Loading trade history...
                                            </td>
                                        </tr>
                                    ) : mixedHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-white/30">
                                                No trades recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        mixedHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition duration-150">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white/90">{item.symbol}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                                        item.side === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                                    }`}>
                                                        {item.side === "LONG" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                        {item.side}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                                                        item.status === "OPEN" 
                                                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                                                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                    }`}>
                                                        {item.status === "OPEN" ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-white/70">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 text-right text-white/70 font-mono">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-mono font-medium ${
                                                    (item.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                    {item.pnl !== undefined ? formatCurrency(item.pnl) : "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right text-white/40 text-xs">
                                                    {item.timestamp.toLocaleString("en-IN", {
                                                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </motion.div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
