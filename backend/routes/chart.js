import express from "express";
import redis from "../services/redisClient.js";

const router = express.Router();

// GET /chart/data?symbol=NIFTY&range=1D
router.get("/data", async (req, res) => {
    const { symbol, range = "1D" } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
    }

    try {
        const isIntraday = range === "1D" || range === "5D";
        const ohlcvKey = isIntraday ? `ohlcv_intraday:${symbol}` : `ohlcv:${symbol}`;
        let ohlcvStr = await redis.get(ohlcvKey);
        const price = await redis.get(`live_price:${symbol}`);
        const volatility = await redis.get(`volatility:${symbol}`);

        if (!ohlcvStr) {
            if (isIntraday) {
                ohlcvStr = await redis.get(`ohlcv:${symbol}`);
            }
            if (!ohlcvStr) {
                return res.status(404).json({ error: `No data found for ${symbol}` });
            }
        }

        let ohlcv = JSON.parse(ohlcvStr);

        // Filter data based on time range
        const now = Date.now();
        const timeRanges = {
            "1D": 1 * 24 * 60 * 60 * 1000,
            "5D": 5 * 24 * 60 * 60 * 1000,
            "1M": 30 * 24 * 60 * 60 * 1000,
            "3M": 90 * 24 * 60 * 60 * 1000,
            "1Y": 365 * 24 * 60 * 60 * 1000,
            "5Y": 5 * 365 * 24 * 60 * 60 * 1000,
        };

        const rangeMs = timeRanges[range] || timeRanges["1D"];
        const cutoffTime = now - rangeMs;

        console.log(`\n=== Chart Data Request ===`);
        console.log(`Symbol: ${symbol}, Range: ${range}, Source: ${isIntraday ? "intraday" : "daily"}`);
        console.log(`Now: ${new Date(now).toISOString()}`);
        console.log(`Cutoff: ${new Date(cutoffTime).toISOString()}`);
        console.log(`Total candles in Redis: ${ohlcv.length}`);
        if (ohlcv.length > 0) {
            const firstCandle = ohlcv[0];
            const lastCandle = ohlcv[ohlcv.length - 1];
            console.log(`First candle: ${new Date(firstCandle.time).toISOString()}`);
            console.log(`Last candle: ${new Date(lastCandle.time).toISOString()}`);
        }

        const toMs = (t) => (t > 9999999999 ? t : t * 1000);

        // Filter candles based on time range
        let filteredCandles = ohlcv.filter(candle => {
            const candleTime = toMs(candle.time);
            return candleTime >= cutoffTime;
        });

        console.log(`Filtered candles: ${filteredCandles.length}`);
        console.log(`=========================\n`);

        // If no data after filtering (e.g., market closed), anchor range to last candle
        if (filteredCandles.length === 0 && ohlcv.length > 0) {
            const lastCandleTime = toMs(ohlcv[ohlcv.length - 1].time);
            const adjustedCutoff = lastCandleTime - rangeMs;
            filteredCandles = ohlcv.filter(candle => toMs(candle.time) >= adjustedCutoff);
        }

        const candles = filteredCandles.length > 0 ? filteredCandles : ohlcv;

        res.json({
            symbol,
            price: parseFloat(price) || null,
            volatility: parseFloat(volatility) || null,
            candles: candles,
            range: range,
            timestamp: Date.now(),
        });
    } catch (err) {
        console.error("Chart route error:", err);
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
});

export default router;
