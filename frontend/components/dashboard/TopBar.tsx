"use client";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type TopBarProps = {
    title?: string;
};

export default function TopBar({ title = "Risk Overview" }: TopBarProps) {
    const { userName, userEmail } = useAuth();
    const initial = (userName || userEmail || "U").trim().charAt(0).toUpperCase();

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

                <Bell size={18} className="text-white/60" />

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold">
                    {initial}
                </div>
            </div>
        </div>
    );
}
