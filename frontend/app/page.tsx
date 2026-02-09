"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, Shield, Zap } from "lucide-react";

// Reuse the AuthScene from the login page for the background animation
const AuthScene = dynamic(
    () => import("@/components/webgl/AuthScene"),
    { ssr: false }
);

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-[#0B0B0F] overflow-hidden text-white font-sans selection:bg-indigo-500/30 text-selection:text-indigo-200">
            
            {/* 🌌 WebGL Background Animation */}
            <div className="absolute inset-0 z-0">
                <AuthScene />
            </div>

            {/* Dark overlay for readability, slightly lighter than auth to show more particles */}
            <div className="absolute inset-0 bg-[#0B0B0F]/80 z-10 pointer-events-none" />

            {/* Gradient Mesh for depth */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                 <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
                 <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>


            {/* 🟢 Main Content Layer */}
            <div className="relative z-20 flex flex-col min-h-screen">
                
                {/* Header */}
                <header className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full pointer-events-auto">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <BarChart2 size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Trade Risk Gate
                        </span>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex items-center gap-6"
                    >
                        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link 
                            href="/signup"
                            className="group px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-indigo-50 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] flex items-center gap-2"
                        >
                            Sign Up
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                </header>

                {/* Hero Section */}
                <main className="relative z-40 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20 pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 backdrop-blur-sm mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                             v2.0 Now Live: Enhanced Risk Engine
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                            <span className="block text-white">Master Risk.</span>
                            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x pb-2">
                                Maximize Returns.
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 leading-relaxed">
                            Professional-grade portfolio telemetry, real-time risk analysis, and automated trade journaling for the modern trader. 
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link 
                                href="/signup"
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 w-full sm:w-auto inline-flex items-center justify-center"
                            >
                                Get Started Free
                            </Link>
                            <Link 
                                href="/login"
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-lg transition-all backdrop-blur-md w-full sm:w-auto inline-flex items-center justify-center"
                            >
                                Live Demo
                            </Link>
                        </div>
                    </motion.div>

                    {/* Features Grid (Mini) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto px-4 w-full"
                    >
                        {[
                            { icon: BarChart2, title: "Real-time Telemetry", text: "Live P&L tracking and exposure monitoring across all your positions." },
                            { icon: Shield, title: "Risk Guards", text: "Automated risk checks and margin usage alerts to protect your capital." },
                            { icon: Zap, title: "Instant Sync", text: "Seamless integration with your broker for sub-second portfolio updates." }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm hover:bg-white/[0.05] transition-colors">
                                <feature.icon size={24} className="text-indigo-400 mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-white/40 leading-relaxed">{feature.text}</p>
                            </div>
                        ))}
                    </motion.div>
                </main>

                <footer className="py-8 text-center text-xs text-white/20">
                    &copy; {new Date().getFullYear()} Trade Risk Gate. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
