
import express from "express";
import { TradeRequestSchema } from "../schemas/trade_req_schema.js";
import { executeOrder } from "../services/orderExecution.js";
import authMiddleware from "../middleware/authMiddleware.js";
import searchRouter from "./search.js";

const router = express.Router();
const schema = TradeRequestSchema;

// Symbols to explicitly block (international stocks)
const BLOCKED_SYMBOLS = new Set([
    // US stocks
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "INTC",
    "JPM", "BAC", "WFC", "V", "MA", "WMT", "DIS", "COCA", "PEP", "MCD",
    // Indices we don't want
    "^GSPC", "^DJI", "^IXIC"
]);

router.use(authMiddleware);

router.post("/place-order", async (req, res) => {
    // Extract userID from JWT token via authMiddleware
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized - no user ID from token" });
    }

    try {
        const symbol = req.body.symbol?.toUpperCase();

        // Validate symbol is provided
        if (!symbol) {
            return res.status(400).json({ error: "Symbol is required" });
        }

        // Block explicitly international symbols
        if (BLOCKED_SYMBOLS.has(symbol)) {
            return res.status(403).json({
                error: "RESTRICTED_MARKET",
                details: `Symbol '${symbol}' is not available in the Indian market. Only NSE/BSE stocks are allowed.`
            });
        }

        const orderData = {
            userId: userId, // Use JWT user ID only
            symbol: symbol,
            atp: Number(req.body.atp),
            side: req.body.side,
            quantity: Number(req.body.quantity),
            // transactionTime is handled by schema default or service
        };

        if (!orderData.symbol || !orderData.atp || !orderData.quantity) {
            throw new Error("Missing required fields: symbol, atp, quantity");
        }

        const result = await executeOrder(orderData);

        res.json({
            success: true,
            message: "Order Executed Successfully",
            data: result
        });
    } catch (err) {
        console.error("Order Execution Error:", err);
        res.status(400).json({
            error: "ORDER_FAILED",
            details: err.message || err,
        })
    }

});

export default router;
