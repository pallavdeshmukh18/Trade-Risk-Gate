import axios from "axios";

const MARKET_SERVICE_URL = "http://market-data-service/live";

export async function fetchMarketData(symbol) {
  try {
    const response = await axios.get(MARKET_SERVICE_URL, {
      params: { symbol },
      timeout: 400,
    });

    const data = response.data;

    return {
      symbol,
      ltp: data.ltp ?? null,
      bid: data.bid ?? null,
      ask: data.ask ?? null,
      volume: data.volume ?? null,
      timestamp: new Date().toISOString(),
      source: "market_service",
    };
  } catch (err) {
    // 🔥 SAFE FALLBACK
    return {
      symbol,
      ltp: null,
      bid: null,
      ask: null,
      volume: null,
      timestamp: new Date().toISOString(),
      source: "STALE_DATA",
    };
  }
}
