import { safeRedisGet } from "./redisClient.js";

export async function fetchMarketData(symbol = "NIFTY") {
  const price = await safeRedisGet(`live_price:${symbol}`);
  const vol = await safeRedisGet(`volatility:${symbol}`);
  const ohlcv = await safeRedisGet(`ohlcv:${symbol}`);

  return {
    symbol,
    price: price ? Number(price) : null,
    volatility: vol ? Number(vol) : null,
    candles: ohlcv ? JSON.parse(ohlcv) : [],
    source: "redis+yahoo",
    timestamp: Date.now(),
  };
}
