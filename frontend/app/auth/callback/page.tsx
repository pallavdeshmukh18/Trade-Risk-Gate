"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthCallbackPage() {
    useEffect(() => {
        const search = window.location.search;
        window.location.replace(`/auth/success${search}`);
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0E1018] px-6 text-white">
            <div className="max-w-md text-center">
                <h1 className="text-2xl font-semibold">Completing Google sign-in</h1>
                <p className="mt-3 text-sm text-white/60">
                    If you are not redirected automatically, head back to the login page.
                </p>
                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
                >
                    Back to login
                </Link>
            </div>
        </main>
    );
}
