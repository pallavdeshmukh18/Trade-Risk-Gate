"use client";

import Image from "next/image";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const { user, logout, isInitializing } = useAuth();

    return (
        <ProtectedRoute>
            {isInitializing || !user ? (
                <p className="text-gray-400">Loading...</p>
            ) : (
            <div className="relative flex min-h-screen overflow-hidden bg-[#0A0C12]">
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute top-24 left-24 h-[520px] w-[520px] bg-indigo-600/12 blur-[150px]" />
                    <div className="absolute bottom-24 right-24 h-[520px] w-[520px] bg-purple-600/12 blur-[150px]" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                <main
                    className={`relative flex-1 px-10 py-8 transition-all duration-300 ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}
                >
                    <div className="space-y-6 animate-fadeInUp">
                        <TopBar title="Settings" />

                        <div className="max-w-3xl mx-auto p-8 space-y-6">
                            <GlassCard>
                                <h2 className="mb-4 text-white text-lg font-semibold">Profile</h2>

                                <div className="flex items-center gap-4">
                                    <Image
                                        src={user.picture || "/default-avatar.svg"}
                                        alt="profile"
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-full border border-white/10 object-cover"
                                    />

                                    <div>
                                        <p className="text-white font-semibold">{user.name}</p>
                                        <p className="text-gray-400 text-sm">{user.email}</p>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <h2 className="mb-4 text-white text-lg font-semibold">Account</h2>

                                <button
                                    onClick={logout}
                                    className="rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition hover:bg-red-500/30"
                                >
                                    Logout
                                </button>
                            </GlassCard>

                            <GlassCard>
                                <h2 className="mb-4 text-white text-lg font-semibold">Connected Account</h2>

                                <p className="text-gray-400 text-sm">
                                    Connected with Google
                                </p>
                            </GlassCard>

                            <GlassCard>
                                <h2 className="mb-4 text-white text-lg font-semibold">Preferences</h2>

                                <label className="flex items-center justify-between">
                                    <span className="text-gray-300">Dark Mode</span>

                                    <input
                                        type="checkbox"
                                        checked={darkMode}
                                        onChange={() => setDarkMode(!darkMode)}
                                    />
                                </label>
                            </GlassCard>
                        </div>
                    </div>
                </main>
            </div>
            )}
        </ProtectedRoute>
    );
}
