"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleSignInButtonProps = {
    text: string;
    disabled?: boolean;
    onCredential: (credential: string) => Promise<void>;
};

export default function GoogleSignInButton({
    text,
    disabled = false,
    onCredential,
}: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (!scriptLoaded || !clientId || !buttonRef.current || !window.google) {
            return;
        }

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async ({ credential }) => {
                if (!credential) {
                    return;
                }

                try {
                    setIsSubmitting(true);
                    await onCredential(credential);
                } finally {
                    setIsSubmitting(false);
                }
            },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "rectangular",
            text,
            width: 320,
        });
    }, [clientId, onCredential, scriptLoaded, text]);

    if (!clientId) {
        return (
            <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 py-3 text-white/50 cursor-not-allowed"
            >
                Google sign-in unavailable
            </button>
        );
    }

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <div className="space-y-3">
                <div
                    ref={buttonRef}
                    className={disabled ? "pointer-events-none opacity-60" : ""}
                />
                {isSubmitting && (
                    <p className="text-center text-sm text-gray-400">
                        Completing Google sign-in...
                    </p>
                )}
            </div>
        </>
    );
}
