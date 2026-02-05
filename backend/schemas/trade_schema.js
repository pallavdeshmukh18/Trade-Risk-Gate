
import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema(
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
        entryPrice: {
            type: Number,
            required: true
        },
        exitPrice: {
            type: Number,
            required: true
        },
        side: {
            type: String,
            enum: ["LONG", "SHORT"],
            required: true
        },
        realizedPnL: {
            type: Number,
            required: true
        },
        entryTime: {
            type: Date
        },
        exitTime: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export default mongoose.model("Trade", TradeSchema);
