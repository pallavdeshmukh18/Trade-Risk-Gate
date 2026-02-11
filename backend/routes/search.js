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

// Flatten all stocks for searching
const ALL_STOCKS = [
    ...POPULAR_STOCKS.indian,
    ...POPULAR_STOCKS.us,
    ...POPULAR_STOCKS.indices
];

// GET /search/stocks?q=REL
router.get("/stocks", async (req, res) => {
    try {
        const query = req.query.q?.toString().toUpperCase().trim();

        if (!query || query.length < 1) {
            return res.json({ results: [] });
        }

        // Search in our popular stocks database
        const matches = ALL_STOCKS.filter(stock =>
            stock.symbol.includes(query) ||
            stock.name.toUpperCase().includes(query)
        ).slice(0, 10);

        // If we have matches, return them
        if (matches.length > 0) {
            return res.json({
                results: matches.map(s => ({
                    symbol: s.symbol,
                    name: s.name
                }))
            });
        }

        // If no matches in popular stocks, try Yahoo Finance search
        try {
            const yahooResults = await yahoo.search(query, {
                quotesCount: 5,
                newsCount: 0
            });

            const suggestions = yahooResults.quotes
                ?.filter(q => q.symbol && q.shortname)
                .map(q => ({
                    symbol: q.symbol,
                    name: q.shortname || q.longname || q.symbol
                }))
                .slice(0, 5) || [];

            return res.json({ results: suggestions });
        } catch (yahooError) {
            console.error("Yahoo search error:", yahooError);
            // Return empty results if Yahoo search fails
            return res.json({ results: [] });
        }

    } catch (error) {
        console.error("Stock search error:", error);
        res.status(500).json({ error: "Search failed" });
    }
});

export default router;
