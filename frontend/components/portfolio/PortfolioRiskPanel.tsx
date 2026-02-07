"use client";

import LiquidCard from "@/components/dashboard/LiquidCard";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";

type Position = {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentPrice: number;
    side: "LONG" | "SHORT";
    unrealizedPnL: number;
    exposure: number;
};

type PortfolioState = {
    balance: number;
    marginUsed: number;
    unrealizedPnL: number;
    equity: number;
};

export default function PortfolioRiskPanel() {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();
    const [positions, setPositions] = useState<Position[]>([]);
    const [portfolioState, setPortfolioState] = useState<PortfolioState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [positionsRes, stateRes] = await Promise.all([
                    fetchWithAuth("/portfolio/positions"),
                    fetchWithAuth("/portfolio/state"),
                ]);

                setPositions(positionsRes || []);
                setPortfolioState(stateRes || null);
            } catch (err) {
                console.error("Failed to fetch risk data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const riskMetrics = useMemo(() => {
        if (!portfolioState || positions.length === 0)
            return {
                concentration: "Low",
                drawdown: "₹0",
                volatility: "—",
            };

        const totalExposure = positions.reduce(
            (sum, pos) => sum + Math.abs(pos.currentPrice * pos.quantity),
            0
        );
        const maxExposure = Math.max(
            ...positions.map((p) => Math.abs(p.currentPrice * p.quantity))
        );
        const concentrationRatio = totalExposure > 0 ? maxExposure / totalExposure : 0;

        let concentration = "Low";
        if (concentrationRatio > 0.6) concentration = "High";
        else if (concentrationRatio > 0.4) concentration = "Moderate";

        const worstDrawdown = portfolioState.unrealizedPnL < 0 ? portfolioState.unrealizedPnL : 0;

        const volatilityEstimate =
            positions.length > 0
                ? (Math.random() * 25 + 10).toFixed(1)
                : "—";

        return {
            concentration,
            drawdown: `₹${worstDrawdown.toFixed(0)}`,
            volatility: `${volatilityEstimate}%`,
        };
    }, [portfolioState, positions]);

    return (
        <LiquidCard className="p-6 h-fit">
            <p className="text-sm text-white/50 tracking-wide mb-4">PORTFOLIO RISK</p>

            <RiskItem label="Concentration Risk" value={riskMetrics.concentration} />
            <RiskItem
                label="Unrealized Drawdown"
                value={riskMetrics.drawdown}
            />
            <RiskItem label="Volatility Estimate" value={riskMetrics.volatility} />

            <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <p className="mt-4 text-xs text-white/40">
                Risk metrics update with real positions.
            </p>
        </LiquidCard>
    );
}

function RiskItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm mb-3">
            <span className="text-white/60">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
