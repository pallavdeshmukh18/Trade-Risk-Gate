"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, BrainCircuit, ChevronDown, Radar, ShieldAlert, Sparkles } from "lucide-react";

const lineIndices = Array.from({ length: 26 }, (_, index) => index);

const showcaseItems = [
    {
        id: "trade-modal",
        label: "Trade Modal",
        title: "Live trade preview",
        subtitle: "Trade feedback reacting to size, exposure, and model confidence",
        text: "As quantity changes, LowkeyLoss reacts with risk delta and loss probability so the trade decision is informed before execution.",
        stats: [
            ["Loss Probability", "72%"],
            ["Risk Delta", "+5.2"],
            ["Signal", "HIGH_RISK"],
        ],
    },
    {
        id: "risk-engine",
        label: "Risk Engine",
        title: "Portfolio intelligence",
        subtitle: "Assistant-style analysis for actual positions",
        text: "See risk score, volatility, VaR, prediction label, and top drivers in a single panel that explains what is happening and why it matters.",
        stats: [
            ["Risk Score", "7.2"],
            ["VaR", "-2.4"],
            ["Status", "LOWKEY LOSS"],
        ],
    },
    {
        id: "dashboard",
        label: "Dashboard",
        title: "Live telemetry",
        subtitle: "Exposure, P&L, sync, and activity in one command view",
        text: "LowkeyLoss compresses raw trading state into a clean operating layer so you can monitor portfolio pressure without jumping across tabs.",
        stats: [
            ["Exposure", "₹4.8L"],
            ["Win Rate", "61%"],
            ["Sync", "LIVE"],
        ],
    },
];

const advantagePanels = [
    {
        title: "Risk-aware by default",
        body: "The app is built around consequence. Portfolio pressure, volatility, concentration, and ML downside probability are surfaced before actions become expensive mistakes.",
    },
    {
        title: "Trade sizing with context",
        body: "The chart modal does more than place orders. It previews risk change, predicts loss probability, and stays stable under fast typing so execution feels sharp.",
    },
    {
        title: "One connected intelligence loop",
        body: "Dashboard, Risk Engine, Trade Modal, and Settings all share the same visual and product language, so the platform feels like one instrument instead of separate tools.",
    },
    {
        title: "Minimal interface, serious signal",
        body: "Glass UI, dark contrast, moving fields, and assistant-style summaries create a premium feel without drowning the user in decoration or dashboard noise.",
    },
];

function buildFlowPath(index: number, variant: 0 | 1 | 2) {
    const startY = 70 + index * 42;
    const bend = 55 + index * 6;
    const endY = 500 + (index - 13) * 6;

    if (variant === 0) {
        return `M 0 ${startY} C ${180 + bend} ${140 + index * 34}, ${380 + bend} ${endY - 100}, 690 ${endY}`;
    }

    if (variant === 1) {
        return `M 0 ${startY + Math.sin(index * 0.5) * 10} C ${210 + bend} ${120 + index * 31}, ${350 + bend} ${endY - 145}, 690 ${endY + Math.cos(index * 0.35) * 24}`;
    }

    return `M 0 ${startY - Math.cos(index * 0.42) * 12} C ${165 + bend} ${165 + index * 36}, ${405 + bend} ${endY - 68}, 690 ${endY - Math.sin(index * 0.28) * 18}`;
}

function FlowField({ side }: { side: "left" | "right" }) {
    return (
        <div
            className={`pointer-events-none absolute top-20 hidden h-[62rem] w-[46vw] opacity-80 lg:block ${side === "left" ? "left-[-8vw]" : "right-[-8vw] scale-x-[-1]"}`}
        >
            <svg
                viewBox="0 0 700 1200"
                className="h-full w-full animate-lineFloat"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {lineIndices.map((index) => (
                    <motion.path
                        key={`${side}-${index}`}
                        d={buildFlowPath(index, 0)}
                        animate={{
                            d: [
                                buildFlowPath(index, 0),
                                buildFlowPath(index, 1),
                                buildFlowPath(index, 2),
                                buildFlowPath(index, 0),
                            ],
                            opacity: [0.4, 0.92, 0.58, 0.4],
                        }}
                        transition={{
                            duration: 9 + (index % 5),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.12,
                        }}
                        stroke="rgba(115, 255, 223, 0.48)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                ))}
            </svg>
        </div>
    );
}

export default function LandingPage() {
    const [activeShowcase, setActiveShowcase] = useState(showcaseItems[0].id);
    const [activePanel, setActivePanel] = useState(0);

    const selectedShowcase =
        showcaseItems.find((item) => item.id === activeShowcase) ?? showcaseItems[0];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#060A0B] font-sans text-white selection:bg-emerald-500/30 text-selection:text-emerald-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,255,200,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(90,130,255,0.08),transparent_28%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />
            <FlowField side="left" />
            <FlowField side="right" />
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/12 blur-[120px]" />
                <div className="absolute left-1/2 top-[36%] h-44 w-[36rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(115,255,223,0.24),transparent_68%)] blur-3xl" />
            </div>

            <div className="relative z-20 flex min-h-screen flex-col">
                <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <Image
                            src="/logo.svg"
                            alt="LowkeyLoss logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <span className="text-xl font-bold tracking-tight text-white">LowkeyLoss</span>
                    </motion.div>

                    <motion.nav
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="hidden items-center gap-10 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/60 backdrop-blur-xl md:flex"
                    >
                        <a href="#product" className="transition-colors hover:text-white">Product</a>
                        <a href="#advantage" className="transition-colors hover:text-white">Features</a>
                        <a href="#platform" className="transition-colors hover:text-white">Platform</a>
                    </motion.nav>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.12 }}
                        className="flex items-center gap-3"
                    >
                        <Link href="/login" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-[#05110D] transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-200"
                        >
                            Enter App
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </motion.div>
                </header>

                <main className="relative z-40 flex flex-1 flex-col items-center px-4 pb-16 pt-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="mx-auto max-w-6xl space-y-12"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300"></span>
                            </span>
                            Live risk telemetry for traders who move fast
                        </div>

                        <div id="product" className="space-y-6">
                            <h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
                                The trade intelligence system
                                <span className="block text-white/55">that calls out risk before it calls out you.</span>
                            </h1>

                            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/52 md:text-xl">
                                LowkeyLoss turns your portfolio, live chart, and order intent into instant signal. See risk deltas, loss probability, concentration pressure, and trade feedback in one dark, surgical workspace.
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/signup"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-50 sm:w-auto"
                            >
                                Start Free
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 sm:w-auto"
                            >
                                Open Dashboard
                            </Link>
                        </div>

                        <div className="relative mx-auto mt-10 max-w-6xl">
                            <div className="absolute inset-x-[18%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-300/65 to-transparent blur-sm lg:block" />

                            <div className="relative mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-[1px] backdrop-blur-xl">
                                <div className="rounded-[2rem] border border-white/10 bg-[#0C1214]/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
                                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                                                <Radar size={26} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm uppercase tracking-[0.24em] text-white/35">Live Signal Deck</p>
                                                <h2 className="mt-1 text-3xl font-semibold text-white">{selectedShowcase.title}</h2>
                                                <p className="mt-1 text-sm text-white/45">{selectedShowcase.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                                            LowkeyLoss AI
                                        </div>
                                    </div>

                                    <div className="grid gap-4 pt-5 md:grid-cols-3">
                                        {selectedShowcase.stats.map(([label, value]) => (
                                            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                                                <p className="text-sm text-white/42">{label}</p>
                                                <p className={`mt-3 text-2xl font-bold ${value.startsWith("+") || value.includes("LOSS") || value.includes("HIGH") ? "text-rose-300" : "text-emerald-200"}`}>
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                                        <p className="text-sm uppercase tracking-[0.22em] text-white/38">Assistant readout</p>
                                        <p className="mt-3 text-base leading-7 text-white/68">
                                            {selectedShowcase.text}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                {showcaseItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveShowcase(item.id)}
                                        className={`rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300 ${activeShowcase === item.id
                                            ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200"
                                            : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <section className="mx-auto mt-8 w-full max-w-6xl rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 text-left backdrop-blur-xl md:p-8">
                            <div className="grid gap-6 md:grid-cols-4">
                                {[
                                    ["Risk reads", "Instant", "Trade feedback updates as you size."],
                                    ["Prediction model", "Live", "Loss probability stays visible in flow."],
                                    ["Portfolio context", "Unified", "Exposure, VaR, and drivers stay connected."],
                                    ["Execution feel", "Stable", "No flicker, no dashboard clutter, no guesswork."],
                                ].map(([label, value, text]) => (
                                    <div key={label} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                                        <p className="text-xs uppercase tracking-[0.22em] text-white/30">{label}</p>
                                        <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
                                        <p className="mt-3 text-sm leading-6 text-white/45">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="mx-auto max-w-5xl space-y-6 pt-10">
                            <h2 className="text-4xl font-semibold leading-[1.05] text-white md:text-6xl">
                                Transforming how traders
                                <span className="block text-white/52">read risk in real time.</span>
                            </h2>
                            <p className="mx-auto max-w-3xl text-base leading-8 text-white/46 md:text-lg">
                                LowkeyLoss compresses raw market state, portfolio context, and model output into something readable at a glance. The result feels less like an AI template and more like a purpose-built terminal for real decisions.
                            </p>
                        </div>

                        <section id="advantage" className="mx-auto w-full max-w-6xl rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-6 backdrop-blur-xl md:p-8">
                            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium uppercase tracking-[0.26em] text-emerald-200/80">Our advantage</p>
                                        <h3 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                                            Built for traders
                                            <span className="block text-white/55">who want signal, not noise.</span>
                                        </h3>
                                        <p className="max-w-md text-base leading-8 text-white/45">
                                            The platform feels premium because every surface has a job. Nothing exists just to fill space. Every card either explains risk, previews consequence, or sharpens execution.
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        {[
                                            {
                                                icon: BrainCircuit,
                                                title: "ML-backed trade previews",
                                                text: "Quantity input becomes live intelligence with risk delta and downside prediction in under a second.",
                                            },
                                            {
                                                icon: ShieldAlert,
                                                title: "Portfolio-first risk engine",
                                                text: "Surface volatility, VaR, concentration, and risk drivers in an assistant-style panel that actually helps.",
                                            },
                                            {
                                                icon: Sparkles,
                                                title: "Execution-grade UX",
                                                text: "Dark glass surfaces, stable feedback loops, and controlled motion make the product feel expensive.",
                                            },
                                        ].map((feature) => (
                                            <div
                                                key={feature.title}
                                                className="rounded-[1.6rem] border border-white/8 bg-black/10 p-5"
                                            >
                                                <feature.icon size={22} className="text-emerald-200" />
                                                <h4 className="mt-4 text-xl font-semibold text-white">{feature.title}</h4>
                                                <p className="mt-2 text-sm leading-7 text-white/48">{feature.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {advantagePanels.map((panel, index) => (
                                        <motion.button
                                            key={panel.title}
                                            initial={{ opacity: 0, y: 18 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.16 + index * 0.08, duration: 0.45 }}
                                            onClick={() => setActivePanel(index)}
                                            className={`w-full rounded-[1.8rem] border p-6 text-left transition-all duration-300 ${activePanel === index
                                                ? "border-emerald-300/20 bg-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                                                : "border-white/8 bg-white/[0.025] hover:bg-white/[0.045]"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="max-w-2xl">
                                                    <p className="text-2xl font-semibold text-white">{panel.title}</p>
                                                    <p className="mt-3 text-sm leading-7 text-white/42">
                                                        {activePanel === index
                                                            ? panel.body
                                                            : panel.body.slice(0, 96) + "..."}
                                                    </p>
                                                </div>
                                                <ChevronDown
                                                    size={22}
                                                    className={`mt-1 shrink-0 text-white/50 transition-transform duration-300 ${activePanel === index ? "rotate-180" : ""}`}
                                                />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="platform" className="mx-auto w-full max-w-6xl">
                            <div className="mb-6 flex items-end justify-between gap-6 text-left">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.22em] text-white/34">Platform surfaces</p>
                                    <h3 className="mt-3 text-3xl font-semibold text-white md:text-4xl">One language across the product.</h3>
                                </div>
                                <p className="hidden max-w-xl text-sm leading-7 text-white/42 md:block">
                                    Every major screen is framed like part of one system, so the experience feels cohesive and premium instead of assembled from disconnected sections.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ["Risk Engine", "Portfolio risk, VaR, prediction labels, confidence, and top drivers.", "Assistant panel"],
                                    ["Trade Modal", "Live chart + instant trade feedback with debounce and no flicker.", "Execution layer"],
                                    ["Dashboard", "Telemetry, exposure, trades, and watchlist in one connected command view.", "Ops center"],
                                    ["Settings", "Google auth, synced identity, profile photo, and clean account controls.", "Identity"],
                                ].map(([title, text, eyebrow]) => (
                                    <div key={title} className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl">
                                        <p className="text-xs uppercase tracking-[0.24em] text-white/30">{eyebrow}</p>
                                        <h4 className="mt-5 text-2xl font-semibold text-white">{title}</h4>
                                        <p className="mt-3 text-sm leading-7 text-white/50">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                </main>

                <footer className="px-6 py-8 text-center text-xs text-white/20 md:px-8">
                    &copy; {new Date().getFullYear()} LowkeyLoss. Trade intelligence for people who actually trade.
                </footer>
            </div>
        </div>
    );
}
