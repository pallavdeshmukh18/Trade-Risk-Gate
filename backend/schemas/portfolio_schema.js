import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
            unique: true
        },

        balance: {
            type: Number,
            required: true,
            default: 100000   // paper trading starting capital
        },

        marginUsed: {
            type: Number,
            default: 0
        },

        unrealizedPnL: {
            type: Number,
            default: 0
        },

        equity: {
            type: Number,
            default: 100000
        }
    },
    { timestamps: true }
);

export default mongoose.model("Portfolio", PortfolioSchema);
