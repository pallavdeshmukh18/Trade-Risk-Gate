import express from "express";
import { fetchMarketData } from "../services/marketClient.js";

const router = express.Router();

router.get("/live", async (req, res) => {
  try {
    const symbol = req.query.symbol || "NIFTY";

    const data = await fetchMarketData(symbol);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Market route error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market data",
    });
  }
});

export default router;
