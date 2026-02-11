import express from "express";
import YahooFinance from "yahoo-finance2";

const router = express.Router();
const yahoo = new YahooFinance();

// Popular stocks database for quick suggestions
const POPULAR_STOCKS = {
    indian: [
        { symbol: "RELIANCE", name: "Reliance Industries" },
        { symbol: "TCS", name: "Tata Consultancy Services" },
        { symbol: "HDFCBANK", name: "HDFC Bank" },
        { symbol: "INFY", name: "Infosys" },
        { symbol: "ICICIBANK", name: "ICICI Bank" },
        { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
        { symbol: "ITC", name: "ITC Limited" },
        { symbol: "SBIN", name: "State Bank of India" },
        { symbol: "BHARTIARTL", name: "Bharti Airtel" },
        { symbol: "LICI", name: "Life Insurance Corporation" },
        { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
        { symbol: "LT", name: "Larsen & Toubro" },
        { symbol: "HCLTECH", name: "HCL Technologies" },
        { symbol: "TATAMOTORS", name: "Tata Motors" },
        { symbol: "AXISBANK", name: "Axis Bank" },
        { symbol: "SUNPHARMA", name: "Sun Pharmaceutical" },
        { symbol: "MARUTI", name: "Maruti Suzuki" },
        { symbol: "BAJFINANCE", name: "Bajaj Finance" },
        { symbol: "ASIANPAINT", name: "Asian Paints" },
        { symbol: "TITAN", name: "Titan Company" },
        { symbol: "ULTRACEMCO", name: "UltraTech Cement" },
        { symbol: "NTPC", name: "NTPC Limited" },
        { symbol: "POWERGRID", name: "Power Grid Corporation" },
        { symbol: "ONGC", name: "Oil and Natural Gas Corporation" },
        { symbol: "TATASTEEL", name: "Tata Steel" },
        { symbol: "JSWSTEEL", name: "JSW Steel" },
        { symbol: "ADANIENT", name: "Adani Enterprises" },
        { symbol: "ADANIPORTS", name: "Adani Ports" },
        { symbol: "COALINDIA", name: "Coal India" },
        { symbol: "HDFCLIFE", name: "HDFC Life Insurance" },
        { symbol: "SBILIFE", name: "SBI Life Insurance" },
        { symbol: "BAJAJFINSV", name: "Bajaj Finserv" },
        { symbol: "BPCL", name: "Bharat Petroleum" },
        { symbol: "GRASIM", name: "Grasim Industries" },
        { symbol: "BRITANNIA", name: "Britannia Industries" },
        { symbol: "TECHM", name: "Tech Mahindra" },
        { symbol: "WIPRO", name: "Wipro" },
        { symbol: "HINDALCO", name: "Hindalco Industries" },
        { symbol: "CIPLA", name: "Cipla" },
        { symbol: "EICHERMOT", name: "Eicher Motors" },
        { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories" },
        { symbol: "DIVISLAB", name: "Divi's Laboratories" },
        { symbol: "TATACONSUM", name: "Tata Consumer Products" },
        { symbol: "APOLLOHOSP", name: "Apollo Hospitals" },
        { symbol: "HEROMOTOCO", name: "Hero MotoCorp" },
        { symbol: "UPL", name: "UPL Limited" },
        { symbol: "CUPID", name: "Cupid Limited" },
    ],
    us: [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "MSFT", name: "Microsoft Corporation" },
        { symbol: "GOOGL", name: "Alphabet Inc." },
        { symbol: "AMZN", name: "Amazon.com Inc." },
        { symbol: "TSLA", name: "Tesla Inc." },
        { symbol: "META", name: "Meta Platforms Inc." },
        { symbol: "NVDA", name: "NVIDIA Corporation" },
        { symbol: "AMD", name: "Advanced Micro Devices" },
        { symbol: "NFLX", name: "Netflix Inc." },
        { symbol: "INTC", name: "Intel Corporation" },
        { symbol: "JPM", name: "JPMorgan Chase & Co." },
        { symbol: "BAC", name: "Bank of America" },
        { symbol: "WFC", name: "Wells Fargo" },
        { symbol: "V", name: "Visa Inc." },
        { symbol: "MA", name: "Mastercard Inc." },
        { symbol: "WMT", name: "Walmart Inc." },
        { symbol: "DIS", name: "Walt Disney Company" },
        { symbol: "COCA", name: "Coca-Cola Company" },
        { symbol: "PEP", name: "PepsiCo Inc." },
        { symbol: "MCD", name: "McDonald's Corporation" },
    ],
    indices: [
        { symbol: "^NSEI", name: "NIFTY 50" },
        { symbol: "^BSESN", name: "BSE SENSEX" },
        { symbol: "^GSPC", name: "S&P 500" },
        { symbol: "^DJI", name: "Dow Jones Industrial Average" },
        { symbol: "^IXIC", name: "NASDAQ Composite" },
    ]
};

// Flatten only Indian stocks for searching (restrict to Indian market only)
const ALL_STOCKS = [
    ...POPULAR_STOCKS.indian,
    // Only NIFTY 50 and BSE SENSEX indices are allowed
    { symbol: "^NSEI", name: "NIFTY 50" },
    { symbol: "^BSESN", name: "BSE SENSEX" },
];

// US stocks that are explicitly blocked
const BLOCKED_US_STOCKS = new Set([
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "INTC",
    "JPM", "BAC", "WFC", "V", "MA", "WMT", "DIS", "COCA", "PEP", "MCD",
    "GOOG", "CSCO", "ORCL", "IBM", "CRM", "ADBE", "PYPL", "UBER", "SNAP", "SPOT"
]);

// List of valid Indian stock symbols for validation
const INDIAN_STOCK_SYMBOLS = new Set(
    POPULAR_STOCKS.indian.map(s => s.symbol.toUpperCase())
);

// GET /search/stocks?q=REL
router.get("/stocks", async (req, res) => {
    try {
        const query = req.query.q?.toString().toUpperCase().trim();

        if (!query || query.length < 1) {
            return res.json({ results: [] });
        }

        // First, check popular stocks database for quick results
        let results = ALL_STOCKS.filter(stock =>
            stock.symbol.includes(query) ||
            stock.name.toUpperCase().includes(query)
        ).slice(0, 10);

        // If popular stocks found, return them
        if (results.length > 0) {
            return res.json({
                results: results.map(s => ({
                    symbol: s.symbol,
                    name: s.name,
                    exchange: s.symbol.startsWith("^") ? "INDEX" : "NSE"
                }))
            });
        }

        // If no popular stocks match, search via Yahoo Finance
        try {
            const searchResult = await yahoo.search(query);

            if (searchResult?.quotes && Array.isArray(searchResult.quotes) && searchResult.quotes.length > 0) {
                // Filter for Indian market stocks only
                const indianStocks = searchResult.quotes
                    .filter(quote => {
                        const sym = quote.symbol?.toUpperCase() || "";
                        // Include NSE (.NS), BSE (.BO), and Indian indices  
                        // Exclude US symbols and indices
                        return (sym.includes(".NS") || sym.includes(".BO") || sym.includes("^NSEI") || sym.includes("^BSESN"))
                            && !sym.includes('^GSPC') && !sym.includes('^DJI') && !sym.includes('^IXIC');
                    })
                    .slice(0, 10)
                    .map(quote => {
                        // Clean symbol: remove .NS/.BO suffix for internal use
                        const cleanSymbol = quote.symbol?.replace(".NS", "").replace(".BO", "") || quote.symbol;
                        return {
                            symbol: cleanSymbol,
                            name: quote.longname || quote.shortname || cleanSymbol,
                            exchange: quote.symbol?.includes(".NS") ? "NSE" : quote.symbol?.includes(".BO") ? "BSE" : "INDEX"
                        };
                    });

                if (indianStocks.length > 0) {
                    return res.json({ results: indianStocks });
                }
            }

            // If Yahoo search didn't return Indian stocks, but query matches pattern, 
            // accept it as a potential Indian stock symbol (blacklist approach)
            // Only reject if it's a known US stock
            if (!BLOCKED_US_STOCKS.has(query)) {
                // Return the query as a potential Indian stock
                return res.json({
                    results: [{
                        symbol: query,
                        name: `${query} (Indian Stock)`,
                        exchange: "NSE"
                    }]
                });
            }

        } catch (yahooError) {
            // If Yahoo search fails, still allow the query as a potential Indian stock
            console.error("Yahoo search error:", yahooError.message);

            if (!BLOCKED_US_STOCKS.has(query)) {
                return res.json({
                    results: [{
                        symbol: query,
                        name: `${query} (Indian Stock)`,
                        exchange: "NSE"
                    }]
                });
            }
        }

        // No results found
        return res.json({ results: [] });

    } catch (error) {
        console.error("Stock search error:", error);
        res.status(500).json({ error: "Search failed" });
    }
});

// Export validation function for use in other routes
router.isIndianStock = function (symbol) {
    if (!symbol) return false;
    return INDIAN_STOCK_SYMBOLS.has(symbol.toUpperCase());
};

export default router;
