"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";
import { getRisk, getPrediction } from "@/lib/api/risk";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type PortfolioPosition = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
};

type RiskInputPosition = {
    symbol: string;
    quantity: number;
    prices: number[];
};

type RiskMetrics = {
    riskScore: number;
    volatility: number;
    var: number;
};

type PredictionMetrics = {
    lossProbability: number;
    prediction: "HIGH_RISK" | "LOW_RISK";
};

function buildRiskPositions(positions: PortfolioPosition[]): RiskInputPosition[] {
    return positions
        .filter((position) => position.quantity > 0)
        .map((position) => ({
            symbol: position.symbol,
            quantity: position.quantity,
            prices: [position.avgEntryPrice, position.currentPrice].filter((value) => Number.isFinite(value)),
        }))
        .filter((position) => position.prices.length >= 2);
}

export default function RiskEnginePage() {
    const { token, userName, isInitializing } = useAuth();
    const { fetchWithAuth } = useFetch();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [positions, setPositions] = useState<PortfolioPosition[]>([]);
    const [risk, setRisk] = useState<RiskMetrics | null>(null);
    const [prediction, setPrediction] = useState<PredictionMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<"portfolio" | "fallback">("portfolio");
    const [now, setNow] = useState<Date>(new Date());

    const riskPositions = useMemo(() => buildRiskPositions(positions), [positions]);

    const fetchFallbackPositions = async (): Promise<PortfolioPosition[]> => {
        const response = await fetch(`/api/ml/chart?symbol=NIFTY&range=1M`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Fallback market data unavailable");
        }

        const closes = Array.isArray(data.candles)
            ? data.candles
                .map((candle: { close?: number }) => candle.close)
                .filter((value: number | undefined): value is number => Number.isFinite(value))
            : [];

        const firstPrice = closes[0] ?? data.price ?? 0;
        const lastPrice = closes[closes.length - 1] ?? data.price ?? firstPrice;

        return [{
            symbol: data.symbol || "NIFTY",
            quantity: 1,
            avgEntryPrice: firstPrice,
            currentPrice: lastPrice,
        }];
    };

    const loadRiskEngine = async () => {
        if (isInitializing) return;

        setIsLoading(true);
        setError(null);

        try {
            let livePositions: PortfolioPosition[] = [];

            try {
                if (token) {
                    const portfolioPositions = await fetchWithAuth("/portfolio/positions");
                    livePositions = Array.isArray(portfolioPositions) ? portfolioPositions : [];
                    setDataSource("portfolio");
                } else {
                    throw new Error("Use fallback market data");
                }
            } catch {
                livePositions = await fetchFallbackPositions();
                setDataSource("fallback");
            }

            const normalizedPositions = buildRiskPositions(livePositions);

            setPositions(livePositions);

            if (normalizedPositions.length === 0) {
                setRisk({ riskScore: 0, volatility: 0, var: 0 });
                setPrediction({ lossProbability: 0, prediction: "LOW_RISK" });
                setPredictionError(null);
                return;
            }

            const [riskResult, predictionResult] = await Promise.allSettled([
                getRisk(normalizedPositions),
                getPrediction(normalizedPositions),
            ]);

            if (riskResult.status === "fulfilled") {
                setRisk(riskResult.value);
            } else {
                throw riskResult.reason;
            }

            if (predictionResult.status === "fulfilled") {
                setPrediction(predictionResult.value);
                setPredictionError(null);
            } else {
                setPrediction(null);
                setPredictionError(
                    predictionResult.reason instanceof Error
                        ? predictionResult.reason.message
                        : "Prediction unavailable"
                );
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load risk engine";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isInitializing) return;
        loadRiskEngine();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isInitializing]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000 * 30);
        return () => clearInterval(timer);
    }, []);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, [now]);

    const status = prediction?.prediction === "HIGH_RISK"
        ? "LOWKEY LOSS 💀"
        : "SAFE TRADE ✅";

    const summary = prediction?.prediction === "HIGH_RISK"
        ? "Your portfolio shows signs of elevated risk and potential loss."
        : "Your portfolio appears stable with manageable risk.";

    const statusToneClass = prediction?.prediction === "HIGH_RISK"
        ? "text-red-400"
        : "text-green-400";

    const panelGlowClass = prediction?.prediction === "HIGH_RISK"
        ? "shadow-[0_24px_80px_rgba(239,68,68,0.20)]"
        : "shadow-[0_24px_80px_rgba(74,222,128,0.20)]";

    const drivers = useMemo(() => {
        const nextDrivers: string[] = [];

        if ((risk?.volatility ?? 0) > 0.02) {
            nextDrivers.push("High market volatility");
        }

        if (positions.length > 0 && (positions[0]?.quantity ?? 0) > 5) {
            nextDrivers.push(`Concentration in ${positions[0].symbol}`);
        }

        if (nextDrivers.length === 0 && !isLoading) {
            nextDrivers.push("No major portfolio risk drivers detected");
        }

        return nextDrivers;
    }, [isLoading, positions, risk]);

    return (
        <ProtectedRoute>
            <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute top-24 left-24 w-[520px] h-[520px] bg-indigo-600/12 blur-[150px]" />
                    <div className="absolute bottom-24 right-24 w-[520px] h-[520px] bg-purple-600/12 blur-[150px]" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 w-[360px] h-[360px] bg-cyan-500/8 blur-[170px] -translate-x-1/2 -translate-y-1/2" />
                </div>
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
                    className={`relative flex-1 px-10 py-8 space-y-10 transition-all duration-300 ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}
                >
                    <TopBar title="Risk Engine" />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="opacity-0 animate-fadeIn transition-all duration-500 ease-out">
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

                    <div className="text-sm text-white/60 opacity-0 animate-fadeIn transition-all duration-500 ease-out">
                        {error ? (
                            <span className="text-rose-400">{error}</span>
                        ) : (
                            <span>
                                {isLoading
                                    ? "Analyzing portfolio risk..."
                                    : dataSource === "portfolio"
                                        ? `${riskPositions.length} portfolio positions analyzed`
                                        : "Using backend market fallback data"}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-end opacity-0 animate-fadeIn transition-all duration-500 ease-out">
                        <button
                            onClick={loadRiskEngine}
                            disabled={isLoading}
                            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/20 hover:shadow-xl disabled:opacity-50"
                        >
                            {isLoading ? "Refreshing..." : "Refresh Analysis"}
                        </button>
                    </div>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-4xl mx-auto space-y-6 p-8 opacity-0 animate-fadeInUp transition-all duration-300 ease-out"
                    >
                        <GlassCard
                            className="animate-fadeInUp transition-all duration-300 ease-out"
                            innerClassName={`rounded-[28px] space-y-6 p-6 transition-all duration-300 ease-out ${panelGlowClass} ${prediction?.prediction === "HIGH_RISK" ? "shadow-2xl shadow-red-500/20 animate-pulse" : "shadow-2xl shadow-green-500/20"}`}
                        >
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">
                                        Trade Intelligence System
                                    </p>
                                    <p className="text-sm text-white/55">
                                        Portfolio Status
                                    </p>
                                    <h1 className={`text-3xl font-bold ${statusToneClass}`}>
                                        {isLoading ? "Analyzing..." : status}
                                    </h1>
                                    <p className="text-gray-400">
                                        {isLoading
                                            ? "Running risk and ML analysis across tracked positions."
                                            : summary}
                                    </p>
                                    <p className="text-sm text-white/60">
                                        {isLoading
                                            ? "Preparing assistant insights for your portfolio."
                                            : `Intelligent readout for ${riskPositions.length} tracked position${riskPositions.length === 1 ? "" : "s"}.`}
                                    </p>
                                </div>

                                {predictionError && (
                                    <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                                        {predictionError}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Metric
                                        label="Risk Score"
                                        value={isLoading ? "—" : risk?.riskScore ?? "—"}
                                        tone={prediction?.prediction === "HIGH_RISK" ? "negative" : "positive"}
                                    />
                                    <Metric
                                        label="Volatility"
                                        value={isLoading ? "—" : risk?.volatility ?? "—"}
                                        tone={(risk?.volatility ?? 0) > 0.02 ? "negative" : "positive"}
                                    />
                                    <Metric
                                        label="VaR"
                                        value={isLoading ? "—" : risk?.var ?? "—"}
                                        tone={(risk?.var ?? 0) < 0 ? "negative" : "positive"}
                                    />
                                    <Metric
                                        label="Loss Probability"
                                        value={isLoading ? "—" : prediction ? `${(prediction.lossProbability * 100).toFixed(0)}%` : "—"}
                                        tone={(prediction?.lossProbability ?? 0) > 0.6 ? "negative" : "positive"}
                                    />
                                </div>

                                <GlassCard
                                    className="animate-fadeInUp transition-all duration-300 ease-out"
                                    innerClassName="rounded-[24px] space-y-6 p-6"
                                >
                                    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-start">
                                        <div>
                                            <p className="text-white text-lg font-semibold">
                                                Top Risk Drivers
                                            </p>
                                            <ul className="mt-2 text-sm text-gray-300 space-y-2">
                                                {isLoading ? (
                                                    <li className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-white/60 animate-pulse">
                                                        Scanning portfolio structure...
                                                    </li>
                                                ) : (
                                                    drivers.map((driver, index) => (
                                                        <li key={index} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl">
                                                            • {driver}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>

                                        <GlassCard
                                            className="animate-fadeInUp transition-all duration-300 ease-out"
                                            innerClassName="rounded-[20px] space-y-2 p-6"
                                        >
                                            <p className="text-gray-400 text-sm">Prediction Label</p>
                                            <p className={`text-white text-lg font-bold ${statusToneClass}`}>
                                                {isLoading ? "—" : prediction?.prediction ?? "LOW_RISK"}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Confidence: {isLoading || !prediction ? "—" : `${Math.round(prediction.lossProbability * 100)}%`}
                                            </p>
                                            <p className="text-xs leading-6 text-white/55">
                                                {dataSource === "portfolio"
                                                    ? "Live portfolio positions are being used for this analysis."
                                                    : "Fallback market data is powering this analysis right now."}
                                            </p>
                                        </GlassCard>
                                    </div>
                                </GlassCard>
                        </GlassCard>
                    </motion.section>
                </main>
            </div>
        </ProtectedRoute>
    );
}

function Metric({
    label,
    value,
    tone = "neutral",
}: {
    label: string;
    value: string | number;
    tone?: "positive" | "negative" | "neutral";
}) {
    const toneClass = tone === "positive"
        ? "text-green-400"
        : tone === "negative"
            ? "text-red-400"
            : "text-blue-400";

    return (
        <GlassCard className="animate-fadeInUp transition-all duration-300 ease-out" innerClassName="space-y-2 p-6">
            <div className="text-gray-400 text-sm">{label}</div>
            <div className={`text-white text-lg font-bold ${toneClass}`}>
                {value}
            </div>
        </GlassCard>
    );
}
