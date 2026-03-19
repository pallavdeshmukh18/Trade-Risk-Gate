"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

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

            <div className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.svg"
                        alt="LowkeyLoss logo"
                        width={32}
                        height={32}
                        className="h-8 w-8"
                    />
                    <span className="text-xl font-semibold tracking-tight text-white">LowkeyLoss</span>
                </div>
            </div>

            {/* Centered Auth Card */}
            <div className="relative z-20 -mt-20 min-h-screen flex items-center justify-center px-4">
                {children}
            </div>
        </div>
    );
}
