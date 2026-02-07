import redis from "./redisClient.js";

export function calcReturns(closes) {
    return closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
}

export function calcVol(returns) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
        returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
}

export async function updateMarket(symbol, ohlcv, options = {}) {
    const {
        ohlcvKey = "ohlcv",
        updateVolatility = true,
        updatePrice = true,
    } = options;

    const closes = ohlcv.map((c) => c.close).filter((v) => v != null);
    const price = closes.length > 0 ? closes.at(-1) : null;

    await redis.set(`${ohlcvKey}:${symbol}`, JSON.stringify(ohlcv));

    if (updateVolatility) {
        const rets = closes.length > 1 ? calcReturns(closes) : [];
        const vol = rets.length > 0 ? calcVol(rets) : 0;
        await redis.set(`volatility:${symbol}`, vol);
    }

    if (updatePrice && price != null) {
        await redis.set(`live_price:${symbol}`, price);
    }

    return { price, volatility: updateVolatility ? await redis.get(`volatility:${symbol}`) : null };
}
