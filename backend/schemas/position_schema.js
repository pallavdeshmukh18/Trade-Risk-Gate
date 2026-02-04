import mongoose from "mongoose";

const PositionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        symbol: {
            type: String,
            required: true,
            index: true
        },

        quantity: {
            type: Number,
            required: true
        },

        avgEntryPrice: {
            type: Number,
            required: true
        },

        currentPrice: {
            type: Number,
            required: true
        },

        side: {
            type: String,
            enum: ["LONG", "SHORT"],
            default: "LONG"
        },

        unrealizedPnL: {
            type: Number,
            default: 0
        },

        exposure: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

export default mongoose.model("Position", PositionSchema);
