"use client";
import LiquidCard from "./LiquidCard";
import { motion } from "framer-motion";

type Props = {
    level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    score: number;
    message: string;
    isLoading?: boolean;
};

const LEVEL_STYLES: Record<Props["level"], { text: string; glow: string; bar: string }> = {
    LOW: {
        text: "text-emerald-400",
        glow: "bg-emerald-500/25",
        bar: "from-emerald-400 to-teal-400"
    },
    MODERATE: {
        text: "text-amber-400",
        glow: "bg-amber-500/25",
        bar: "from-amber-400 to-orange-500"
    },
    HIGH: {
        text: "text-rose-400",
        glow: "bg-rose-500/25",
        bar: "from-rose-400 to-pink-500"
    },
    CRITICAL: {
        text: "text-red-500",
        glow: "bg-red-500/35",
        bar: "from-red-500 to-rose-600"
    }
};

export default function RiskCard({ level, score, message, isLoading }: Props) {
    const clampedScore = Math.min(Math.max(score, 0), 120);
    const styles = LEVEL_STYLES[level];

    return (
        <LiquidCard className="p-7 min-h-[220px]">
            {/* 🔴 Risk Pulse Graphic */}
            <div className="absolute -top-16 -right-16 w-56 h-56">
                <div className="absolute inset-0 rounded-full border border-white/20 animate-pingSlow" />
                <div className="absolute inset-6 rounded-full border border-white/15" />
                <div className="absolute inset-12 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* ambient danger glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 ${styles.glow} blur-[120px]`} />

            <p className="text-sm text-white/50 tracking-wide">
                SYSTEM RISK
            </p>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 text-4xl font-medium ${styles.text}`}
            >
                {isLoading ? "—" : level}
            </motion.h2>

            <p className="mt-3 text-sm text-white/60 max-w-[90%]">
                {isLoading ? "Loading portfolio telemetry..." : message}
            </p>

            {/* liquid meter */}
            <div className="mt-6 h-[6px] w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(clampedScore, 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
                />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                <span>Risk score</span>
                <span>{isLoading ? "—" : `${clampedScore.toFixed(1)}%`}</span>
            </div>
        </LiquidCard>
    );
}
