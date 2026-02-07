"use client";

import { motion } from "framer-motion";

type Props = {
    children: React.ReactNode;
    className?: string;
};



export default function LiquidCard({ children, className }: Props) {
    return (
        <motion.div
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                    "--x",
                    `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                    "--y",
                    `${e.clientY - rect.top}px`
                );
            }}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`
        relative rounded-[22px] overflow-hidden
        bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]
        backdrop-blur-[18px]
        border border-white/15
        shadow-[0_20px_60px_rgba(0,0,0,0.45)]
        ${className}
      `}
        >

            {/* Liquid highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.18),transparent_45%)] opacity-60" />

            {/* Edge glow */}
            <div className="absolute inset-0 rounded-[22px] ring-1 ring-white/10" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
