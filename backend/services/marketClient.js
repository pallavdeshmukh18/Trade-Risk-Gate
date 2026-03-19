import { safeRedisGet } from "./redisClient.js";
import { fetchStockDataOnDemand } from "./yahooFeed.js";

function normalizeSymbol(symbol = "NIFTY") {
  const rawSymbol = String(symbol).trim().toUpperCase();

  if (!rawSymbol) {
    return { rawSymbol: "NIFTY", ticker: "NIFTY" };
  }

  if (rawSymbol.startsWith("^") || rawSymbol.includes(".") || rawSymbol.includes("-")) {
    return { rawSymbol, ticker: rawSymbol };
  }

  if (rawSymbol === "NIFTY") {
    return { rawSymbol, ticker: "NIFTY" };
  }

  return { rawSymbol, ticker: `${rawSymbol}.NS` };
}

export async function fetchMarketData(symbol = "NIFTY") {
  const { rawSymbol, ticker } = normalizeSymbol(symbol);
  const fallbackSymbol = rawSymbol !== ticker ? rawSymbol : null;

  let price = await safeRedisGet(`live_price:${ticker}`);
  if (!price && fallbackSymbol) {
    price = await safeRedisGet(`live_price:${fallbackSymbol}`);
  }

  let vol = await safeRedisGet(`volatility:${ticker}`);
  if (!vol && fallbackSymbol) {
    vol = await safeRedisGet(`volatility:${fallbackSymbol}`);
  }

  let ohlcv = await safeRedisGet(`ohlcv:${ticker}`);
  if (!ohlcv && fallbackSymbol) {
    ohlcv = await safeRedisGet(`ohlcv:${fallbackSymbol}`);
  }

  let candles = ohlcv ? JSON.parse(ohlcv) : [];

  if (!Array.isArray(candles) || candles.length === 0) {
    const fetchResult = await fetchStockDataOnDemand(ticker);
    candles = Array.isArray(fetchResult?.candles) ? fetchResult.candles : [];

    if (!price && candles.length > 0) {
      price = String(candles[candles.length - 1]?.close ?? "");
    }
  }

  return {
    symbol: rawSymbol,
    ticker,
    price: price ? Number(price) : null,
    volatility: vol ? Number(vol) : null,
    candles,
    source: "redis+yahoo",
    timestamp: Date.now(),
  };
}
