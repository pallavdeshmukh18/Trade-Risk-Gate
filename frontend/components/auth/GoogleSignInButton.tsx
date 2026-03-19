"use client";

type GoogleSignInButtonProps = {
    text: string;
    disabled?: boolean;
    onCredential: () => Promise<void>;
};

export default function GoogleSignInButton({
    text,
    disabled = false,
    onCredential,
}: GoogleSignInButtonProps) {
    return (
        <button
            type="button"
            onClick={() => void onCredential()}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 py-3 text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {text === "signup_with" ? "Continue with Google" : "Sign in with Google"}
        </button>
    );
}
