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

export default function PortfolioSummary() {
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
                console.error("Failed to fetch portfolio data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const totalExposure = useMemo(
        () => positions.reduce((sum, pos) => sum + Math.abs(pos.currentPrice * pos.quantity), 0),
        [positions]
    );

    const netExposure = useMemo(() => {
        if (!portfolioState?.equity || totalExposure === 0) return 0;
        return totalExposure / portfolioState.equity;
    }, [portfolioState, totalExposure]);

    const grossExposure = useMemo(() => {
        if (!portfolioState?.equity || totalExposure === 0) return 0;
        return (totalExposure + (portfolioState.marginUsed || 0)) / portfolioState.equity;
    }, [portfolioState, totalExposure]);

    const largestPosition = useMemo(() => {
        if (positions.length === 0) return null;
        const sorted = [...positions].sort(
            (a, b) =>
                Math.abs(b.currentPrice * b.quantity) - Math.abs(a.currentPrice * a.quantity)
        );
        const exposure =
            totalExposure > 0
                ? (Math.abs(sorted[0].currentPrice * sorted[0].quantity) / totalExposure) * 100
                : 0;
        return { symbol: sorted[0].symbol, exposure };
    }, [positions, totalExposure]);

    return (
        <LiquidCard className="p-6 sticky top-4 z-20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Metric
                    label="Net Exposure"
                    value={isLoading ? "—" : `${netExposure.toFixed(2)}x`}
                />
                <Metric
                    label="Gross Exposure"
                    value={isLoading ? "—" : `${grossExposure.toFixed(2)}x`}
                />
                <Metric
                    label="Open Positions"
                    value={isLoading ? "—" : `${positions.length}`}
                />
                <Metric
                    label="Largest Weight"
                    value={
                        isLoading || !largestPosition
                            ? "—"
                            : `${largestPosition.symbol} · ${largestPosition.exposure.toFixed(0)}%`
                    }
                />
            </div>
        </LiquidCard>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-white/50 tracking-wide">{label}</p>
            <p className="mt-1 text-lg font-medium">{value}</p>
        </div>
    );
}
