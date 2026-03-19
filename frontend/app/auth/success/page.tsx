"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthSuccessPage() {
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        const name = searchParams.get("name");
        const email = searchParams.get("email");
        const picture = searchParams.get("picture");

        if (!token) {
            window.location.replace("/login?error=Google%20login%20failed");
            return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("auth_token", token);

        if (name) {
            localStorage.setItem("user_name", name);
        }

        if (email) {
            localStorage.setItem("user_email", email);
        }

        if (picture) {
            localStorage.setItem("user_picture", picture);
        } else {
            localStorage.removeItem("user_picture");
        }

        window.location.replace("/dashboard");
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0E1018] px-6 text-white">
            <div className="max-w-md text-center">
                <h1 className="text-2xl font-semibold">Signing you in</h1>
                <p className="mt-3 text-sm text-white/60">
                    Your Google session is being saved. You will be redirected shortly.
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
