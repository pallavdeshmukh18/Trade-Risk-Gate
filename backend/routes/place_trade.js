import express from "express";
import { TradeRequestSchema } from "../schemas/trade_req_schema.js";
import updateOrderData from "../db/place_order.js";

const router = express.Router();
const schema = TradeRequestSchema;

router.post("/place-order", async (req, res)=>{
//   userID: string,
//   symbol: string,
//   atp: Number,
//   side: string,
//   quantity: Number,
//   transactionTime: Date
    const q = {
      userID: req.query.userID,
      symbol: req.query.symbol,
      atp: parseInt(req.query.atp),
      side: req.query.side,
      quantity: parseInt(req.query.quantity),
      transctionTime: req.query.timestamp | Date.now(),
    };

    try{
        await updateOrderData(q);
        res.json({
            success: true,
            message: "Order Placed!",
            order_info: q
        });
    }catch(err){
        res.status(400).json({
            error: "ERROR",
            details: err,
        })
    }

});

export default router;