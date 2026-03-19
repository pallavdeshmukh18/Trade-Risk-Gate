"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import Watchlist from "@/components/dashboard/Watchlist";
import ChartModal from "@/components/portfolio/ChartModal";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function WatchlistPage() {
    const { userName } = useAuth();
    const [now, setNow] = useState<Date>(new Date());
    
    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Chart Modal State
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [isChartOpen, setIsChartOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000 * 30);
        return () => clearInterval(timer);
    }, []);

    const handleSelectSymbol = (symbol: string) => {
        setSelectedSymbol(symbol);
        setIsChartOpen(true);
    };

    const handleCloseChart = () => {
        setIsChartOpen(false);
        setSelectedSymbol(null);
    };

    const greeting = (() => {
        const hour = now.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    })();

    return (
        <ProtectedRoute>
            <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">

                {/* 🌌 Premium Ambient Background */}
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

                {/* Sidebar */}
                <Sidebar 
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                {/* Main Content */}
                <main 
                    className={`relative flex-1 px-10 py-8 space-y-10 transition-all duration-300
                    ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}
                >

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

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0E1018] border border-white/5 rounded-2xl p-6 shadow-2xl"
                    >
                         <Watchlist onSelectSymbol={handleSelectSymbol} isFullPage={true} />
                    </motion.div>

                </main>

                {/* Chart Modal */}
                {selectedSymbol && (
                    <ChartModal 
                        symbol={selectedSymbol}
                        isOpen={isChartOpen}
                        onClose={handleCloseChart}
                        onTradeSuccess={() => {}}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
