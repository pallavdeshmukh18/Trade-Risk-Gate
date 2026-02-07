"use client";

import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import PortfolioSummary from "../../components/portfolio/PortfolioSummary";
import PositionsTable from "../../components/portfolio/PositionsTable";
import PortfolioRiskPanel from "../../components/portfolio/PortfolioRiskPanel";

export default function PortfolioPage() {
    return (
        <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">

            {/* Ambient background (shared language with dashboard) */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-32 left-24 w-[520px] h-[520px] bg-indigo-600/10 blur-[160px]" />
                <div className="absolute bottom-24 right-24 w-[520px] h-[520px] bg-purple-600/10 blur-[160px]" />
                <motion.div
                    className="absolute bottom-24 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[100px]"
                    animate={{ x: [0, -30, 0], opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                    transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <Sidebar />

            <main className="relative flex-1 ml-64 px-10 py-8 space-y-8">
                <div className="flex items-center justify-between">
                    <TopBar title="Portfolio" />
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        ↻ Refresh
                    </button>
                </div>

                <PortfolioSummary />

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    <div className="xl:col-span-3">
                        <PositionsTable />
                    </div>

                    <PortfolioRiskPanel />
                </div>
            </main>
        </div>
    );
}
