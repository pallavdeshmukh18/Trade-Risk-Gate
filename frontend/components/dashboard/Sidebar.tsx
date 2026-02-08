"use client";
import {
    LayoutDashboard,
    Briefcase,
    ShieldAlert,
    Settings,
    LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItemProps = {
    icon: LucideIcon;
    label: string;
    href: string;
    isCollapsed?: boolean;
};

type SidebarProps = {
    onSelectSymbol?: (symbol: string) => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
};

import { Menu, ChevronLeft } from "lucide-react";
import Watchlist from "./Watchlist";

export default function Sidebar({ onSelectSymbol, isCollapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside 
            className={`fixed left-0 top-0 h-screen bg-[#0E1018] border-r border-white/10 p-4 overflow-y-auto transition-all duration-300
            ${isCollapsed ? "w-20" : "w-64"}`}
        >
            <div className="flex items-center justify-between mb-8">
                {!isCollapsed && (
                    <h1 className="text-xl font-semibold whitespace-nowrap">
                        Trade Risk Gate
                    </h1>
                )}
                <button 
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="space-y-2 text-sm text-white/70">
                <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={pathname === "/dashboard"} isCollapsed={isCollapsed} />
                <NavItem icon={Briefcase} label="Portfolio" href="/portfolio" active={pathname === "/portfolio"} isCollapsed={isCollapsed} />
                <NavItem icon={ShieldAlert} label="Risk Engine" href="/risk-engine" isCollapsed={isCollapsed} />
                <NavItem icon={Settings} label="Settings" href="/settings" isCollapsed={isCollapsed} />
            </nav>

            {!isCollapsed && onSelectSymbol && <Watchlist onSelectSymbol={onSelectSymbol} />}
        </aside>
    );
}

function NavItem({ icon: Icon, label, href, active, isCollapsed }: NavItemProps & { active?: boolean }) {
    return (
        <Link href={href}>
            <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
            ${active ? "bg-white/10 text-white" : "hover:bg-white/5"}
            ${isCollapsed ? "justify-center" : ""}`}
            >
                <Icon size={20} />
                {!isCollapsed && <span>{label}</span>}
            </div>
        </Link>
    );
}
