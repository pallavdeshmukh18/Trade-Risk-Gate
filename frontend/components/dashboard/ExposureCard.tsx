import LiquidCard from "./LiquidCard";
import { motion } from "framer-motion";

type ExposureItem = {
    label: string;
    value: number;
};

type Props = {
    exposures: ExposureItem[];
    isLoading?: boolean;
};

export default function ExposureCard({ exposures, isLoading }: Props) {
    const display = exposures.length > 0 ? exposures : [{ label: "—", value: 0 }];

    return (
        <LiquidCard className="p-7">
            <p className="text-sm text-white/50 tracking-wide mb-4">
                EXPOSURE
            </p>

            {display.map((x, i) => (
                <div key={x.label} className="mb-5">
                    <div className="flex justify-between text-sm mb-2">
                        <span>{x.label}</span>
                        <span className="text-white/50">
                            {isLoading ? "—" : `${x.value.toFixed(1)}%`}
                        </span>
                    </div>

                    <div className="h-[5px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(Math.max(x.value, 0), 100)}%` }}
                            transition={{ delay: i * 0.15, duration: 1 }}
                            className="h-full bg-gradient-to-r from-indigo-400 to-violet-500"
                        />
                    </div>
                </div>
            ))}
        </LiquidCard>
    );
}
