"use client";
import Image from "next/image";
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type TopBarProps = {
    title?: string;
};

export default function TopBar({ title = "Risk Overview" }: TopBarProps) {
    const { user, userName, userEmail, logout } = useAuth();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const initial = (userName || userEmail || "U").trim().charAt(0).toUpperCase();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
                {title}
            </h2>

            <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.035))] px-3 py-2 text-white/60 transition-all duration-300 hover:border-emerald-200/20 hover:bg-emerald-300/5">
                    <Search size={16} className="text-emerald-200/70" />
                    <input
                        className="ml-2 w-40 bg-transparent text-sm outline-none placeholder:text-white/35"
                        placeholder="Search"
                    />
                </div>

                <Bell size={18} className="cursor-pointer text-white/60 transition hover:text-emerald-200" />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        {user?.picture ? (
                            <div className="h-9 w-9 overflow-hidden rounded-full border border-emerald-200/15 shadow-lg transition-all duration-300 group-hover:shadow-emerald-300/20">
                                <Image
                                    src={user.picture}
                                    alt="Profile"
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 text-sm font-semibold text-[#05110D] shadow-lg transition-all duration-300 group-hover:shadow-emerald-300/30">
                                {initial}
                            </div>
                        )}
                        <ChevronDown
                            size={14}
                            className={`text-white/60 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                                }`}
                        />
                    </div>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-emerald-200/10 bg-[#0E1018]/95 shadow-2xl backdrop-blur-xl"
                            >
                                {/* User Info Section */}
                                <div className="border-b border-emerald-200/10 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {user?.picture ? (
                                            <div className="h-10 w-10 overflow-hidden rounded-full border border-emerald-200/15">
                                                <Image
                                                    src={user.picture}
                                                    alt="Profile"
                                                    width={40}
                                                    height={40}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 text-sm font-semibold text-[#05110D]">
                                                {initial}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white/90 truncate">
                                                {userName || "User"}
                                            </div>
                                            <div className="text-xs text-white/50 truncate">
                                                {userEmail}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            // Add profile navigation here if needed
                                        }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/70 transition hover:bg-emerald-300/5 hover:text-emerald-100"
                                    >
                                        <User size={16} />
                                        <span>Profile</span>
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
