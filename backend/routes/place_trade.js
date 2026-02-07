
import express from "express";
import { TradeRequestSchema } from "../schemas/trade_req_schema.js";
import { executeOrder } from "../services/orderExecution.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const schema = TradeRequestSchema;

router.use(authMiddleware);

router.post("/place-order", async (req, res) => {
    // Extract userID from JWT token via authMiddleware
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized - no user ID from token" });
    }

    try {
        const orderData = {
            userId: userId, // Use JWT user ID only
            symbol: req.body.symbol,
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
