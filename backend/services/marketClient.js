import redis from "./redisClient.js";

export async function fetchMarketData(symbol = "NIFTY") {
  const price = await redis.get(`live_price:${symbol}`);
  const vol = await redis.get(`volatility:${symbol}`);
  const ohlcv = await redis.get(`ohlcv:${symbol}`);

  return {
    symbol,
    price: price ? Number(price) : null,
    volatility: vol ? Number(vol) : null,
    candles: ohlcv ? JSON.parse(ohlcv) : [],
    source: "redis+yahoo",
    timestamp: Date.now(),
  };
}
