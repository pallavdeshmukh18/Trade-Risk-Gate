import axios from "axios";
import { configDotenv } from "dotenv";
configDotenv();

let API_KEY = process.env.STOCK_API || "demo";

const MARKET_SERVICE_URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=RELIANCE.BSE&outputsize=compact&apikey=${API_KEY}`;

export async function fetchMarketData() {
  try {
    const response = await axios.get(MARKET_SERVICE_URL, {
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    console.error("MARKET FETCH ERROR:", err.message);
    return { error: err.message };
  }
}

