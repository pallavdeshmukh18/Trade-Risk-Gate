import express from "express";
import redis from "../services/redisClient.js";
import { fetchStockDataOnDemand } from "../services/yahooFeed.js";

const router = express.Router();

async function handleChartRequest(req, res) {
    const { symbol, range = "1D" } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
    }

    try {
        const rawSymbol = String(symbol).trim().toUpperCase();
        const ticker = rawSymbol.includes(".") ? rawSymbol : `${rawSymbol}.NS`;
        const isIntraday = range === "1D" || range === "5D";
        const primarySymbol = ticker;
        const fallbackSymbol = rawSymbol !== ticker ? rawSymbol : null;
        const primaryOhlcvKey = isIntraday ? `ohlcv_intraday:${primarySymbol}` : `ohlcv:${primarySymbol}`;
        const fallbackOhlcvKey = fallbackSymbol
            ? (isIntraday ? `ohlcv_intraday:${fallbackSymbol}` : `ohlcv:${fallbackSymbol}`)
            : null;

        let ohlcvStr = await redis.get(primaryOhlcvKey);
        if (!ohlcvStr && fallbackOhlcvKey) {
            ohlcvStr = await redis.get(fallbackOhlcvKey);
        }

        let price = await redis.get(`live_price:${primarySymbol}`);
        if (!price && fallbackSymbol) {
            price = await redis.get(`live_price:${fallbackSymbol}`);
        }

        let volatility = await redis.get(`volatility:${primarySymbol}`);
        if (!volatility && fallbackSymbol) {
            volatility = await redis.get(`volatility:${fallbackSymbol}`);
        }

        // If no data found in cache, fetch on-demand
        if (!ohlcvStr) {
            console.log(`No cached data for ${rawSymbol}, fetching on-demand...`);
            console.log("Fetching chart for:", ticker);
            const fetchResult = await fetchStockDataOnDemand(ticker);

            if (!fetchResult.success) {
                return res.status(404).json({
                    error: `Unable to fetch data for ${rawSymbol}. Please check if the symbol is correct.`
                });
            }

            // Try to get the data again after fetching
            ohlcvStr = await redis.get(primaryOhlcvKey);
            if (!ohlcvStr && fallbackOhlcvKey) {
                ohlcvStr = await redis.get(fallbackOhlcvKey);
            }
            if (!ohlcvStr) {
                // Fallback to daily data if intraday not available
                if (isIntraday) {
                    ohlcvStr = await redis.get(`ohlcv:${primarySymbol}`);
                    if (!ohlcvStr && fallbackSymbol) {
                        ohlcvStr = await redis.get(`ohlcv:${fallbackSymbol}`);
                    }
                }
            }
        }

        if (!ohlcvStr) {
            return res.status(404).json({ error: `No data found for ${rawSymbol}` });
        }

        let ohlcv = JSON.parse(ohlcvStr);

        if (!Array.isArray(ohlcv) || ohlcv.length === 0) {
            return res.json({ candles: [] });
        }

        // Filter data based on time range
        const now = Date.now();
        const timeRanges = {
            "1D": 1 * 24 * 60 * 60 * 1000,
            "5D": 5 * 24 * 60 * 60 * 1000,
            "1W": 7 * 24 * 60 * 60 * 1000,
            "1M": 30 * 24 * 60 * 60 * 1000,
            "3M": 90 * 24 * 60 * 60 * 1000,
            "6M": 180 * 24 * 60 * 60 * 1000,
            "1Y": 365 * 24 * 60 * 60 * 1000,
            "5Y": 5 * 365 * 24 * 60 * 60 * 1000,
        };

        const rangeMs = timeRanges[range] || timeRanges["1D"];
        const cutoffTime = now - rangeMs;

        console.log(`\n=== Chart Data Request ===`);
        console.log(`Symbol: ${rawSymbol}, Ticker: ${ticker}, Range: ${range}, Source: ${isIntraday ? "intraday" : "daily"}`);
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
            symbol: rawSymbol,
            ticker,
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
}

// GET /chart?symbol=NIFTY&range=1D
router.get("/", handleChartRequest);

// Backward-compatible alias for older callers
router.get("/data", handleChartRequest);

export default router;
