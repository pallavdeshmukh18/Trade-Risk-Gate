import YahooFinance from "yahoo-finance2";
import { updateMarket } from "./marketEngine.js";

const yahoo = new YahooFinance();

// ✅ Multiple symbols supported
const SYMBOLS = [
    { yahoo: "^NSEI", cache: "NIFTY" },
    { yahoo: "AAPL", cache: "AAPL" },
    { yahoo: "RELIANCE.NS", cache: "RELIANCE" },
    { yahoo: "CUPID.NS", cache: "CUPID" }
];

function getStartDate() {
    // Fetch 5 years of data to support all time ranges
    return Math.floor((Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) / 1000);
}

function getStartDateDays(days) {
    return Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
}

export async function startYahooFeed() {
    async function pull() {
        for (const { yahoo: yahooSymbol, cache } of SYMBOLS) {
            try {
                console.log(`Fetching data for ${yahooSymbol}...`);
                const result = await yahoo.chart(yahooSymbol, {
                    period1: getStartDate(),
                    interval: "1d", // Daily data for historical ranges
                });

                const candles = result.quotes
                    .map((q) => ({
                        time: q.date.getTime(),
                        open: q.open,
                        high: q.high,
                        low: q.low,
                        close: q.close,
                        volume: q.volume,
                    }))
                    .filter((c) => c.close);

                console.log(`Fetched ${candles.length} candles for ${cache}`);

                // ✅ Store per-symbol market data
                await updateMarket(cache, candles);

                // Intraday data for short ranges (1D/5D)
                const intradayResult = await yahoo.chart(yahooSymbol, {
                    period1: getStartDateDays(5),
                    period2: Math.floor(Date.now() / 1000),
                    interval: "5m",
                });

                const intradayCandles = intradayResult.quotes
                    .map((q) => ({
                        time: q.date.getTime(),
                        open: q.open,
                        high: q.high,
                        low: q.low,
                        close: q.close,
                        volume: q.volume,
                    }))
                    .filter((c) => c.close);

                console.log(`Fetched ${intradayCandles.length} intraday candles for ${cache}`);

                await updateMarket(cache, intradayCandles, {
                    ohlcvKey: "ohlcv_intraday",
                    updateVolatility: false,
                    updatePrice: true,
                });
            } catch (e) {
                console.error(`Yahoo feed error (${yahooSymbol}):`, e.message);
            }
        }
    }

    // initial pull
    await pull();

    // repeat every 5 minutes for daily data
    setInterval(pull, 5 * 60_000);
}
