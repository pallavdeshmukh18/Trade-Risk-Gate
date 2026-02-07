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
};

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0E1018] border-r border-white/10 p-6 overflow-y-auto">
            <h1 className="text-xl font-semibold mb-10">
                Trade Risk Gate
            </h1>

            <nav className="space-y-4 text-sm text-white/70">
                <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={pathname === "/dashboard"} />
                <NavItem icon={Briefcase} label="Portfolio" href="/portfolio" active={pathname === "/portfolio"} />
                <NavItem icon={ShieldAlert} label="Risk Engine" href="/risk-engine" />
                <NavItem icon={Settings} label="Settings" href="/settings" />
            </nav>
        </aside>
    );
}

function NavItem({ icon: Icon, label, href, active }: NavItemProps & { active?: boolean }) {
    return (
        <Link href={href}>
            <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
            ${active ? "bg-white/10 text-white" : "hover:bg-white/5"}`}
            >
                <Icon size={18} />
                {label}
            </div>
        </Link>
    );
}
