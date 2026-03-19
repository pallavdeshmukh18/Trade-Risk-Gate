import express from "express";
import { safeRedisGet } from "../services/redisClient.js";
import { fetchStockDataOnDemand } from "../services/yahooFeed.js";

const router = express.Router();

function parseCandles(raw) {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

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

        let ohlcvStr = await safeRedisGet(primaryOhlcvKey);
        if (!ohlcvStr && fallbackOhlcvKey) {
            ohlcvStr = await safeRedisGet(fallbackOhlcvKey);
        }

        let price = await safeRedisGet(`live_price:${primarySymbol}`);
        if (!price && fallbackSymbol) {
            price = await safeRedisGet(`live_price:${fallbackSymbol}`);
        }

        let volatility = await safeRedisGet(`volatility:${primarySymbol}`);
        if (!volatility && fallbackSymbol) {
            volatility = await safeRedisGet(`volatility:${fallbackSymbol}`);
        }

        let ohlcv = parseCandles(ohlcvStr);

        // If no usable data found in cache, fetch on-demand and return the fresh payload directly.
        if (ohlcv.length === 0) {
            console.log(`No cached data for ${rawSymbol}, fetching on-demand...`);
            console.log("Fetching chart for:", ticker);
            const fetchResult = await fetchStockDataOnDemand(ticker);

            if (!fetchResult.success) {
                return res.status(404).json({
                    error: `Unable to fetch data for ${rawSymbol}. Please check if the symbol is correct.`
                });
            }

            const fetchedCandles = isIntraday
                ? (fetchResult.intradayCandles?.length ? fetchResult.intradayCandles : fetchResult.candles)
                : fetchResult.candles;

            if (Array.isArray(fetchedCandles) && fetchedCandles.length > 0) {
                ohlcv = fetchedCandles;
                if (!price) {
                    price = fetchedCandles[fetchedCandles.length - 1]?.close ?? null;
                }
            } else {
                // If cache writes succeeded, try the cache once more before giving up.
                ohlcvStr = await safeRedisGet(primaryOhlcvKey);
                if (!ohlcvStr && fallbackOhlcvKey) {
                    ohlcvStr = await safeRedisGet(fallbackOhlcvKey);
                }
                if (!ohlcvStr && isIntraday) {
                    ohlcvStr = await safeRedisGet(`ohlcv:${primarySymbol}`);
                    if (!ohlcvStr && fallbackSymbol) {
                        ohlcvStr = await safeRedisGet(`ohlcv:${fallbackSymbol}`);
                    }
                }
                ohlcv = parseCandles(ohlcvStr);
            }
        }

        if (ohlcv.length === 0) {
            return res.status(404).json({ error: `No data found for ${rawSymbol}` });
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

        console.log(
            `Returning ${candles.length} candles for ${rawSymbol} (${ticker}) range=${range} source=${isIntraday ? "intraday" : "daily"}`
        );

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
