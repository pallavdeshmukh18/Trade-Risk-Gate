"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function SignupForm() {
    const router = useRouter();
    const { signup, isLoading, error } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);

        if (!name || !email || !password) {
            setLocalError("Please fill in all fields");
            return;
        }

        if (!agreedToTerms) {
            setLocalError("You must agree to the Terms & Conditions");
            return;
        }

        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters");
            return;
        }

        try {
            await signup(email, password, name);
            router.push("/dashboard");
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Signup failed");
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
                Create an account
            </h1>

            <p className="text-sm text-gray-400 mb-6">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-gray-200 hover:underline"
                >
                    Log in
                </Link>
            </p>

            {displayError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-400">
                    {displayError}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Name */}
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-[#1B1B22] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50"
                />

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
                        placeholder="Enter your password"
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

                {/* Terms */}
                <label className="flex items-center text-sm text-gray-400 gap-2">
                    <input
                        type="checkbox"
                        className="accent-white"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={isLoading}
                    />
                    I agree to the{" "}
                    <span className="text-gray-200 hover:underline cursor-pointer">
                        Terms & Conditions
                    </span>
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading || !agreedToTerms}
                    className="w-full mt-4 rounded-lg bg-white text-black hover:bg-gray-200 transition py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Creating account..." : "Create account"}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-sm text-gray-500">Or register with</span>
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
