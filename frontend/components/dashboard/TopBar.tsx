"use client";
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type TopBarProps = {
    title?: string;
};

export default function TopBar({ title = "Risk Overview" }: TopBarProps) {
    const { userName, userEmail, logout } = useAuth();
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
                <div className="flex items-center bg-white/5 px-3 py-2 rounded-lg text-white/60">
                    <Search size={16} />
                    <input
                        className="bg-transparent outline-none ml-2 text-sm w-40"
                        placeholder="Search"
                    />
                </div>

                <Bell size={18} className="text-white/60 cursor-pointer hover:text-white/80 transition" />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300">
                            {initial}
                        </div>
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
                                className="absolute right-0 mt-3 w-64 bg-[#0E1018]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                                {/* User Info Section */}
                                <div className="px-4 py-3 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold">
                                            {initial}
                                        </div>
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
                                        className="w-full px-4 py-2.5 flex items-center gap-3 text-white/70 hover:bg-white/5 hover:text-white/90 transition text-sm"
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
