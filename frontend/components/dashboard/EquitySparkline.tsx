"use client";

import { motion } from "framer-motion";

export default function EquitySparkline() {
    return (
        <svg
            viewBox="0 0 100 40"
            className="w-full h-12 mt-4"
            preserveAspectRatio="none"
        >
            <motion.path
                d="M0,30 C10,26 20,34 30,28 40,22 50,26 60,20 70,16 80,18 100,10"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="2.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            />

            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
            </defs>
        </svg>
    );
}
