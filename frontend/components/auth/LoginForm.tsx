"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginForm() {
    const router = useRouter();
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);

        if (!email || !password) {
            setLocalError("Please fill in all fields");
            return;
        }

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Login failed");
        }
    };

    const displayError = localError || error;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-[#14141A]/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md"
        >
            <h1 className="text-3xl font-semibold text-white mb-2">
                Log in
            </h1>

            <p className="text-sm text-gray-400 mb-6">
                Don’t have an account?{" "}
                <Link
                    href="/signup"
                    className="text-gray-200 hover:underline"
                >
                    Create one
                </Link>
            </p>

            {displayError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-400">
                    {displayError}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-[#1B1B22] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50"
                />

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg bg-[#1B1B22] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {showPassword ? "🙈" : "👁"}
                    </button>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-gray-400 hover:text-gray-200 hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 rounded-lg bg-white text-black hover:bg-gray-200 transition py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Logging in..." : "Log in"}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-sm text-gray-500">Or continue with</span>
                <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Google */}
            <button className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 py-3 text-white hover:bg-white/5 transition">
                <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                />
                Continue with Google
            </button>
        </motion.div>
    );
}
