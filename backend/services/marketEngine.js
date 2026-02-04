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

export async function updateMarket(symbol, ohlcv) {
    const closes = ohlcv.map((c) => c.close);
    const rets = calcReturns(closes);
    const vol = calcVol(rets);
    const price = closes.at(-1);

    await redis.set(`ohlcv:${symbol}`, JSON.stringify(ohlcv));
    await redis.set(`volatility:${symbol}`, vol);
    await redis.set(`live_price:${symbol}`, price);

    return { price, volatility: vol };
}
