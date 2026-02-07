"use client";

import LiquidCard from "./LiquidCard";
import { motion } from "framer-motion";
import EquitySparkline from "./EquitySparkline";


type Props = {
    title: string;
    value: string;
    delta?: string;
    positive?: boolean;
    sparkline?: boolean;
};

export default function StatCard({ title, value, delta, positive, sparkline }: Props) {
    return (
        <LiquidCard className="p-7">
            <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm tracking-wide text-white/55"
            >
                {title}
            </motion.p>

            {sparkline && <EquitySparkline />}

            <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-3 text-[2.6rem] font-medium tracking-tight"
            >
                {value}
            </motion.h3>

            {delta && (
                <div
                    className={`mt-3 text-sm ${positive ? "text-emerald-400" : "text-rose-400"
                        }`}
                >
                    {delta}
                </div>
            )}
        </LiquidCard>
    );
}
