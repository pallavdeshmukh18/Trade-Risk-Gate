"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

const AuthScene = dynamic(
    () => import("@/components/webgl/AuthScene"),
    { ssr: false }
);

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-screen bg-[#0B0B0F] overflow-hidden">
            {/* WebGL Background */}
            <div className="absolute inset-0 z-0">
                <AuthScene />
            </div>

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/60 z-10" />

            {/* Centered Auth Card */}
            <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
                {children}
            </div>
        </div>
    );
}
