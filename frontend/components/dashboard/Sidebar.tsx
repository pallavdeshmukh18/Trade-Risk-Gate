"use client";
import Image from "next/image";
import {
    LayoutDashboard,
    Briefcase,
    ShieldAlert,
    Settings,
    LucideIcon,
    List,
    History, // Added History icon
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
    isCollapsed: boolean;
    toggleSidebar: () => void;
    onSelectSymbol?: (symbol: string) => void;
};

import { Menu, ChevronLeft } from "lucide-react";

export default function Sidebar({
    isCollapsed,
    toggleSidebar,
    onSelectSymbol,
}: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside 
            className={`fixed left-0 top-0 h-screen bg-[#0E1018] border-r border-emerald-200/10 p-4 overflow-y-auto transition-all duration-300
            ${isCollapsed ? "w-20" : "w-64"}`}
        >
            <div className="flex items-center justify-between mb-8">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 whitespace-nowrap">
                        <Image
                            src="/logo.svg"
                            alt="LowkeyLoss logo"
                            width={28}
                            height={28}
                            className="h-7 w-7"
                        />
                        <h1 className="text-xl font-semibold whitespace-nowrap">
                            LowkeyLoss
                        </h1>
                    </div>
                )}
                {isCollapsed && (
                    <Image
                        src="/logo.svg"
                        alt="LowkeyLoss logo"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                    />
                )}
                <button 
                    onClick={toggleSidebar}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-emerald-300/10 hover:text-emerald-200"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="space-y-2 text-sm text-white/70">
                <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={pathname === "/dashboard"} isCollapsed={isCollapsed} />
                <NavItem icon={Briefcase} label="Portfolio" href="/portfolio" active={pathname === "/portfolio"} isCollapsed={isCollapsed} />
                <NavItem icon={List} label="Watchlist" href="/watchlist" active={pathname === "/watchlist"} isCollapsed={isCollapsed} />
                <NavItem icon={History} label="Trades" href="/trades" active={pathname === "/trades"} isCollapsed={isCollapsed} />
                <NavItem icon={ShieldAlert} label="Risk Engine" href="/risk-engine" active={pathname === "/risk-engine"} isCollapsed={isCollapsed} />
                <NavItem icon={Settings} label="Settings" href="/settings" isCollapsed={isCollapsed} />
            </nav>
        </aside>
    );
}

function NavItem({ icon: Icon, label, href, active, isCollapsed }: NavItemProps & { active?: boolean }) {
    return (
        <Link href={href}>
            <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300
            ${active ? "bg-emerald-300/10 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(110,255,214,0.14)]" : "hover:bg-emerald-300/5 hover:text-emerald-50"}
            ${isCollapsed ? "justify-center" : ""}`}
            >
                <Icon size={20} />
                {!isCollapsed && <span>{label}</span>}
            </div>
        </Link>
    );
}
