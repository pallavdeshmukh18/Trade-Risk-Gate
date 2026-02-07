import LiquidCard from "./LiquidCard";

type Props = {
    flags: string[];
    isLoading?: boolean;
};

export default function RiskFlags({ flags, isLoading }: Props) {
    const display = flags.length > 0 ? flags : ["NO ACTIVE WARNINGS"];

    return (
        <LiquidCard className="p-6">
            <p className="text-sm text-white/50 mb-3 tracking-wide">
                ACTIVE WARNINGS
            </p>

            <div className="flex flex-wrap gap-3">
                {display.map((f) => (
                    <span
                        key={f}
                        className="
              px-3 py-1.5 rounded-full
              text-xs tracking-wide
              bg-white/10 backdrop-blur
              border border-white/20
              hover:bg-white/15 transition
            "
                    >
                        {isLoading ? "LOADING" : f}
                    </span>
                ))}
            </div>
        </LiquidCard>
    );
}
