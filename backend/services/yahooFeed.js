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

function oneDayAgo() {
    return Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

export async function startYahooFeed() {
    async function pull() {
        for (const { yahoo: yahooSymbol, cache } of SYMBOLS) {
            try {
                const result = await yahoo.chart(yahooSymbol, {
                    period1: oneDayAgo(),
                    interval: "1m",
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

                // ✅ Store per-symbol market data
                await updateMarket(cache, candles);
            } catch (e) {
                console.error(`Yahoo feed error (${yahooSymbol}):`, e.message);
            }
        }
    }

    // initial pull
    await pull();

    // repeat every minute
    setInterval(pull, 60_000);
}
