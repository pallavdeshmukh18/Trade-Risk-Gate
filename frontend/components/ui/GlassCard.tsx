"use client";

type GlassCardProps = {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
};

export default function GlassCard({ children, className = "", innerClassName = "" }: GlassCardProps) {
    return (
        <div
            className={`relative rounded-2xl bg-[linear-gradient(180deg,rgba(110,255,214,0.18),rgba(255,255,255,0.08))] p-[1px] transition-all duration-300 hover:scale-[1.02] ${className}`}
        >
            <div
                className={`relative rounded-2xl border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.035))] p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 ${innerClassName}`}
            >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(115,255,223,0.07),transparent_38%)]" />
                {children}
            </div>
        </div>
    );
}
