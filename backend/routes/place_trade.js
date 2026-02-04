import express from "express";
import { TradeRequestSchema } from "../schemas/trade_req_schema.js";

const router = express.Router();
const schema = TradeRequestSchema;

router.post("/place-order", async (req, res)=>{
    const q = {
        symbol: req.query.symbol,
        side: req.query.side,
        quantity: parseInt(req.query.quantity),
        order_type: req.query.order_type,
        price: parseFloat(req.query.price),
        strategy_id: req.query.strategy_id | null,
        timestamp: req.query.timestamp | 0
    }

    
    res.json({
        success: true,
        message: "Order Placed!",
        order_info: q
    });
});

export default router;