import express from "express";
import redis from "../services/redisClient.js";

const router = express.Router();

// GET /chart/data?symbol=NIFTY
router.get("/data", async (req, res) => {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
    }

    try {
        const ohlcvStr = await redis.get(`ohlcv:${symbol}`);
        const price = await redis.get(`live_price:${symbol}`);
        const volatility = await redis.get(`volatility:${symbol}`);

        if (!ohlcvStr) {
            return res.status(404).json({ error: `No data found for ${symbol}` });
        }

        const ohlcv = JSON.parse(ohlcvStr);

        res.json({
            symbol,
            price: parseFloat(price) || null,
            volatility: parseFloat(volatility) || null,
            candles: ohlcv,
            timestamp: Date.now(),
        });
    } catch (err) {
        console.error("Chart route error:", err);
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
});

export default router;
