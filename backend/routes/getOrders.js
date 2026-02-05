import express from "express";
import findOrderData from "../db/fetchOrders.js";

const router = express.Router();

router.get("/get-order", async (req, res) => {
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

  try {
    const orders = await findOrderData(q);
    if(orders.length == 0) res.json({
      success: true,
      message: "Orders Fetched, no orders!!",
    });
    else {res.json({
      success: true,
      message: "Orders Fetched",
      order_info: orders,
    });}
  } catch (err) {
    res.status(400).json({
      error: "ERROR",
      details: err,
    });
  }
});

export default router;
