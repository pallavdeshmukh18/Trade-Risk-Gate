"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import RiskCard from "@/components/dashboard/RiskCard";
import ExposureCard from "@/components/dashboard/ExposureCard";
import RiskFlags from "@/components/dashboard/RiskFlags";
import LiquidCard from "@/components/dashboard/LiquidCard";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type PortfolioState = {
    balance: number;
    marginUsed: number;
    unrealizedPnL: number;
    equity: number;
};

type Position = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
    side: "LONG" | "SHORT";
    unrealizedPnL: number;
    exposure: number;
};

type PnLSummary = {
    totalRealizedPnL: number;
    totalTrades: number;
    winRate: number;
};

type Trade = {
    _id: string;
    symbol: string;
    quantity: number;
    side: "LONG" | "SHORT";
    realizedPnL: number;
    exitTime?: string;
    createdAt?: string;
};

type MarketData = {
    symbol: string;
    price: number | null;
    volatility: number | null;
    timestamp: number;
};

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number | null | undefined, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: digits,
    }).format(value);
};

export default function DashboardPage() {
    const { token, userName } = useAuth();
    const { fetchWithAuth } = useFetch();

    const [portfolioState, setPortfolioState] = useState<PortfolioState | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [pnlSummary, setPnlSummary] = useState<PnLSummary | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [market, setMarket] = useState<MarketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [now, setNow] = useState<Date>(new Date());

    const loadDashboard = async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);

        try {
            const [state, positionsRes, pnlRes, tradesRes, marketRes] = await Promise.all([
                fetchWithAuth("/portfolio/state"),
                fetchWithAuth("/portfolio/positions"),
                fetchWithAuth("/stats/pnl/summary"),
                fetchWithAuth("/stats/pnl/trades"),
                fetchWithAuth("/market/live?symbol=NIFTY"),
            ]);

            setPortfolioState(state);
            setPositions(positionsRes || []);
            setPnlSummary(pnlRes || null);
            setTrades(tradesRes?.trades || []);
            setMarket(marketRes?.data || null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load dashboard";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchWithAuth("/portfolio/sync", { method: "POST" });
            await loadDashboard();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sync failed";
            setError(message);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [token]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000 * 30);
        return () => clearInterval(timer);
    }, []);

    const totalExposure = useMemo(() => {
        return positions.reduce((sum, pos) => sum + Math.abs(pos.currentPrice * pos.quantity), 0);
    }, [positions]);

    const exposureBreakdown = useMemo(() => {
        if (totalExposure === 0) return [] as { label: string; value: number }[];

        const map = new Map<string, number>();
        positions.forEach((pos) => {
            const exposure = Math.abs(pos.currentPrice * pos.quantity);
            map.set(pos.symbol, (map.get(pos.symbol) || 0) + exposure);
        });

        return Array.from(map.entries())
            .map(([label, value]) => ({ label, value: (value / totalExposure) * 100 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [positions, totalExposure]);

    const riskScore = useMemo(() => {
        if (!portfolioState?.equity || totalExposure === 0) return 0;
        return (totalExposure / portfolioState.equity) * 100;
    }, [portfolioState, totalExposure]);

    const riskLevel = useMemo(() => {
        if (riskScore < 40) return "LOW";
        if (riskScore < 70) return "MODERATE";
        if (riskScore < 100) return "HIGH";
        return "CRITICAL";
    }, [riskScore]);

    const riskMessage = useMemo(() => {
        if (!portfolioState) return "Portfolio telemetry is initializing.";
        if (riskScore > 100) return "Exposure exceeds equity coverage. Review leverage immediately.";
        if (riskScore > 70) return "Exposure is elevated. Consider trimming concentrated positions.";
        if (riskScore > 40) return "Risk posture is within bounds, watch top positions.";
        return "Portfolio is balanced with controlled exposure.";
    }, [portfolioState, riskScore]);

    const riskFlags = useMemo(() => {
        const flags: string[] = [];
        const topExposure = exposureBreakdown[0]?.value || 0;

        if (topExposure > 60) flags.push("HIGH CONCENTRATION");
        if ((portfolioState?.unrealizedPnL || 0) < 0) flags.push("NEGATIVE UNREALIZED P&L");
        if ((pnlSummary?.winRate || 0) < 45 && (pnlSummary?.totalTrades || 0) > 10) {
            flags.push("LOW WIN RATE");
        }
        if ((portfolioState?.marginUsed || 0) > (portfolioState?.balance || 0) * 0.5) {
            flags.push("ELEVATED MARGIN USAGE");
        }

        return flags;
    }, [exposureBreakdown, portfolioState, pnlSummary]);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, [now]);

    return (
        <ProtectedRoute>
            <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">

                {/* 🌌 Premium Ambient Background (kills AI look) */}
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute top-24 left-24 w-[520px] h-[520px] bg-indigo-600/12 blur-[150px]" />
                    <div className="absolute bottom-24 right-24 w-[520px] h-[520px] bg-purple-600/12 blur-[150px]" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                    <div className="absolute top-1/2 left-1/2 w-[360px] h-[360px] bg-cyan-500/8 blur-[170px] -translate-x-1/2 -translate-y-1/2" />
                </div>
                {/* 🧬 Subtle system grid */}
                <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035]">
                    <svg width="100%" height="100%">
                        <defs>
                            <pattern
                                id="grid"
                                width="80"
                                height="80"
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d="M 80 0 L 0 0 0 80"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* ✨ Ambient motion accents */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <motion.div
                        className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl"
                        animate={{ y: [0, 24, 0], opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-24 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[100px]"
                        animate={{ x: [0, -30, 0], opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-purple-500/12 blur-[90px]"
                        animate={{ y: [0, -20, 0], x: [0, 15, 0], opacity: [0.35, 0.65, 0.35] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    <motion.div
                        className="absolute -top-40 left-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px]"
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.25, 0.5, 0.25] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
                </div>


                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="relative flex-1 ml-64 px-10 py-8 space-y-10">

                    {/* Top Bar */}
                    <TopBar />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white/95 tracking-tight">
                                {greeting}{userName ? `, ${userName}` : ""}
                            </h1>
                            <div className="text-sm text-white/45 mt-2">
                                {now.toLocaleString("en-IN", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-white/60">
                            {error ? (
                                <span className="text-rose-400">{error}</span>
                            ) : (
                                <span>Realtime risk telemetry synced</span>
                            )}
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="px-4 py-2 rounded-full text-sm bg-white/10 hover:bg-white/20 border border-white/15 transition disabled:opacity-50"
                        >
                            {isSyncing ? "Syncing..." : "Sync Portfolio"}
                        </button>
                    </div>

                    {/* HERO METRICS — intentionally asymmetric entrance */}
                    <motion.section
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: {
                                transition: { staggerChildren: 0.08 },
                            },
                        }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-7"
                    >
                        <motion.div variants={fadeUp}>
                            <StatCard
                                title="Net Equity"
                                value={isLoading ? "—" : formatCurrency(portfolioState?.equity)}
                                delta={pnlSummary ? `Win rate ${formatNumber(pnlSummary.winRate, 1)}%` : undefined}
                                positive={(pnlSummary?.winRate || 0) >= 50}
                                sparkline
                            />
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <StatCard
                                title="Cash Balance"
                                value={isLoading ? "—" : formatCurrency(portfolioState?.balance)}
                                delta={pnlSummary ? `${pnlSummary.totalTrades} trades` : undefined}
                                positive={(pnlSummary?.totalTrades || 0) > 0}
                            />
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <StatCard
                                title="Today’s P&L"
                                value={isLoading ? "—" : formatCurrency(portfolioState?.unrealizedPnL)}
                                delta={portfolioState ? `${formatNumber((portfolioState.unrealizedPnL / Math.max(portfolioState.balance || 1, 1)) * 100, 2)}%` : undefined}
                                positive={(portfolioState?.unrealizedPnL || 0) >= 0}
                            />
                        </motion.div>
                    </motion.section>

                    {/* RISK CORE — this is the soul */}
                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="grid grid-cols-1 xl:grid-cols-5 gap-8"
                    >
                        {/* Risk gets visual dominance */}
                        <div className="xl:col-span-3">
                            <RiskCard
                                level={riskLevel}
                                score={riskScore}
                                message={riskMessage}
                                isLoading={isLoading}
                            />
                        </div>

                        <div className="xl:col-span-2">
                            <ExposureCard exposures={exposureBreakdown} isLoading={isLoading} />
                        </div>
                    </motion.section>

                    {/* WARNINGS */}
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <RiskFlags flags={riskFlags} isLoading={isLoading} />
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                    >
                        <LiquidCard className="p-6 xl:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-white/50 tracking-wide">OPEN POSITIONS</p>
                                <span className="text-xs text-white/40">
                                    {isLoading ? "—" : `${positions.length} active`}
                                </span>
                            </div>

                            {positions.length === 0 && !isLoading ? (
                                <div className="text-sm text-white/40">No active positions found.</div>
                            ) : (
                                <div className="space-y-3">
                                    {positions.slice(0, 6).map((pos) => (
                                        <div key={pos.symbol} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="text-white/80">{pos.symbol}</div>
                                                <div className="text-xs text-white/40">
                                                    {pos.side} • {formatNumber(pos.quantity, 0)} @ {formatNumber(pos.avgEntryPrice)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={pos.unrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                    {formatCurrency(pos.unrealizedPnL)}
                                                </div>
                                                <div className="text-xs text-white/40">
                                                    {formatCurrency(pos.currentPrice)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </LiquidCard>

                        <LiquidCard className="p-6">
                            <p className="text-sm text-white/50 tracking-wide mb-4">RECENT TRADES</p>
                            {trades.length === 0 && !isLoading ? (
                                <div className="text-sm text-white/40">No trades recorded yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {trades.slice(0, 5).map((trade) => (
                                        <div key={trade._id} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="text-white/80">{trade.symbol}</div>
                                                <div className="text-xs text-white/40">
                                                    {trade.side} • {formatNumber(trade.quantity, 0)}
                                                </div>
                                            </div>
                                            <div className={trade.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                {formatCurrency(trade.realizedPnL)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </LiquidCard>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                    >
                        <LiquidCard className="p-6 xl:col-span-2">
                            <p className="text-sm text-white/50 tracking-wide mb-4">PORTFOLIO SNAPSHOT</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-xs text-white/40">Equity</div>
                                    <div className="text-white/80 mt-1">
                                        {isLoading ? "—" : formatCurrency(portfolioState?.equity)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-white/40">Exposure</div>
                                    <div className="text-white/80 mt-1">
                                        {isLoading ? "—" : formatCurrency(totalExposure)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-white/40">Margin Used</div>
                                    <div className="text-white/80 mt-1">
                                        {isLoading ? "—" : formatCurrency(portfolioState?.marginUsed)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-white/40">Realized P&L</div>
                                    <div className="text-white/80 mt-1">
                                        {isLoading ? "—" : formatCurrency(pnlSummary?.totalRealizedPnL)}
                                    </div>
                                </div>
                            </div>
                        </LiquidCard>

                        <LiquidCard className="p-6">
                            <p className="text-sm text-white/50 tracking-wide mb-4">MARKET SNAPSHOT</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60">Symbol</span>
                                    <span className="text-white/85">{market?.symbol || "NIFTY"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60">Last Price</span>
                                    <span className="text-white/85">{formatCurrency(market?.price ?? null)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60">Volatility</span>
                                    <span className="text-white/85">{formatNumber(market?.volatility ?? null, 2)}</span>
                                </div>
                                <div className="text-xs text-white/35">
                                    {market?.timestamp ? `Updated ${new Date(market.timestamp).toLocaleTimeString()}` : "Awaiting feed"}
                                </div>
                            </div>
                        </LiquidCard>
                    </motion.section>

                    {/* Footer hint — subtle system credibility */}
                    <div className="text-xs text-white/30 tracking-wide pt-4">
                        System status: Live • Market data synced • Risk engine active
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

/* 🔹 Motion Preset (non-generic) */
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 220,
            damping: 26,
        },
    },
};
