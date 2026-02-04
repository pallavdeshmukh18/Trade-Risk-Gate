import YahooFinance from "yahoo-finance2";
import { updateMarket } from "./marketEngine.js";

const yahoo = new YahooFinance();
const SYMBOL = "^NSEI"; // NIFTY 50
const CACHE_SYMBOL = "NIFTY";

function oneDayAgo() {
    return Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

export async function startYahooFeed() {
    async function pull() {
        try {
            const result = await yahoo.chart(SYMBOL, {
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

            await updateMarket(CACHE_SYMBOL, candles);
        } catch (e) {
            console.error("Yahoo feed error:", e.message);
        }
    }

    // initial pull
    await pull();

    // repeat every minute
    setInterval(pull, 60_000);
}
