
import express from "express";
import { TradeRequestSchema } from "../schemas/trade_req_schema.js";
import { executeOrder } from "../services/orderExecution.js";

const router = express.Router();
const schema = TradeRequestSchema;

router.post("/place-order", async (req, res)=>{
    // Extract parameters from Query (legacy) or Body (standard)
    // The original code used req.query for a POST, which is unusual but we support it.
    
    try {
        const orderData = {
          userId: req.query.userID || req.body.userID,
          symbol: req.query.symbol || req.body.symbol,
          atp: Number(req.query.atp || req.body.atp),
          side: req.query.side || req.body.side,
          quantity: Number(req.query.quantity || req.body.quantity),
          // transactionTime is handled by schema default or service
        };

        if (!orderData.userId || !orderData.symbol || !orderData.atp || !orderData.quantity) {
             throw new Error("Missing required fields");
        }

        const result = await executeOrder(orderData);
        
        res.json({
            success: true,
            message: "Order Executed Successfully",
            data: result
        });
    } catch(err){
        console.error("Order Execution Error:", err);
        res.status(400).json({
            error: "ORDER_FAILED",
            details: err.message || err,
        })
    }

});

export default router;
