
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,   // Using userId instead of userID for consistency with other schemas
        required: true,
        index: true
    },
    securityId: {
        type: String
    },
    symbol: {
        type: String,
        required: true
    },
    atp: {
        type: Number,
        required: true
    },
    side: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "EXECUTED", "FAILED"],
        default: "EXECUTED" // Assuming immediate execution for now
    },
    transactionTime: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Order", OrderSchema);
