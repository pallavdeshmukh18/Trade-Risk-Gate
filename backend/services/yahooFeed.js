import YahooFinance from "yahoo-finance2";
import { updateMarket } from "./marketEngine.js";

const yahoo = new YahooFinance();

// ✅ Only preload index for market overview - All other stocks fetched on-demand
const SYMBOLS = [
    { yahoo: "^NSEI", cache: "NIFTY" }
];

function getStartDate() {
    // Fetch 5 years of data to support all time ranges
    return Math.floor((Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) / 1000);
}

function getStartDateDays(days) {
    return Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
}

/**
 * Convert a stock symbol to Yahoo Finance format
 * Indian stocks need .NS suffix (NSE) or .BO suffix (BSE)
 * US stocks and indices can be used as-is
 */
function toYahooSymbol(symbol) {
    if (!symbol) return null;

    // Clean up the symbol
    const clean = symbol.toUpperCase().trim();

    const INDEX_ALIASES = {
        NIFTY: "^NSEI",
        SENSEX: "^BSESN",
    };

    if (INDEX_ALIASES[clean]) {
        return INDEX_ALIASES[clean];
    }

    // Already has a suffix or is an index (^NSEI, ^GSPC) or crypto (BTC-USD)
    if (clean.includes('.') || clean.startsWith('^') || clean.includes('-')) {
        return clean;
    }

    // Common US stocks and indices - no suffix needed
    const US_SYMBOLS = [
        // Major Tech
        'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA',
        'AMD', 'NFLX', 'INTC', 'CSCO', 'ORCL', 'IBM', 'CRM', 'ADBE',
        'PYPL', 'UBER', 'SNAP', 'SPOT', 'SQ', 'COIN', 'SHOP', 'TWTR', 'X',
        // Enterprise/Cloud
        'NOW', 'SNOW', 'ZM', 'TEAM', 'OKTA', 'DDOG', 'NET', 'MDB', 'CRWD',
        // Entertainment/Media
        'DIS', 'NFLX', 'PARA', 'WBD', 'CMCSA', 'T', 'VZ',
        // Financial
        'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK', 'SCHW',
        // Healthcare/Pharma
        'PFE', 'JNJ', 'MRK', 'ABBV', 'UNH', 'CVS', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY',
        // Retail/Consumer
        'WMT', 'TGT', 'HD', 'LOW', 'COST', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP',
        // Industrial/Auto
        'BA', 'GE', 'F', 'GM', 'CAT', 'DE', 'HON', 'MMM', 'LMT', 'RTX',
        // Energy
        'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX',
        // Semiconductors
        'TSM', 'AVGO', 'QCOM', 'TXN', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'MPWR',
        // ETFs & Common tickers
        'SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VTI', 'GLD', 'SLV', 'TLT'
    ];

    if (US_SYMBOLS.includes(clean)) {
        return clean;
    }

    // Default to Indian NSE stocks - covers 99% of Indian stocks
    return `${clean}.NS`;
}

/**
 * Fetch data on-demand for any stock symbol
 * Returns both daily and intraday data
 */
export async function fetchStockDataOnDemand(symbol) {
    const yahooSymbol = toYahooSymbol(symbol);
    let candles = [];
    let intradayCandles = [];

    try {
        console.log(`On-demand fetch for ${symbol} (Yahoo: ${yahooSymbol})`);

        // Fetch daily data (5 years)
        const result = await yahoo.chart(yahooSymbol, {
            period1: getStartDate(),
            interval: "1d",
        });

        candles = result.quotes
            .map((q) => ({
                time: q.date.getTime(),
                open: q.open,
                high: q.high,
                low: q.low,
                close: q.close,
                volume: q.volume,
            }))
            .filter((c) => c.close);

        console.log(`Fetched ${candles.length} daily candles for ${symbol}`);

        if (candles.length === 0) {
            return { success: false, error: `No daily candles found for ${symbol}` };
        }

        // Store in cache
        await updateMarket(symbol, candles);
    } catch (error) {
        console.error(`Failed to fetch daily data for ${symbol}:`, error.message);
        return { success: false, error: error.message };
    }

    try {
        // Fetch intraday data (5 days)
        const intradayResult = await yahoo.chart(yahooSymbol, {
            period1: getStartDateDays(5),
            period2: Math.floor(Date.now() / 1000),
            interval: "5m",
        });

        intradayCandles = intradayResult.quotes
            .map((q) => ({
                time: q.date.getTime(),
                open: q.open,
                high: q.high,
                low: q.low,
                close: q.close,
                volume: q.volume,
            }))
            .filter((c) => c.close);

        console.log(`Fetched ${intradayCandles.length} intraday candles for ${symbol}`);

        await updateMarket(symbol, intradayCandles, {
            ohlcvKey: "ohlcv_intraday",
            updateVolatility: false,
            updatePrice: true,
        });
    } catch (error) {
        console.error(`Intraday fetch failed for ${symbol}:`, error.message);
    }

    return {
        success: true,
        candles,
        intradayCandles,
        partial: intradayCandles.length === 0,
    };
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
