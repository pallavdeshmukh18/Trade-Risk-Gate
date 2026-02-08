import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";

// Mock list of popular Indian stocks for search dropdown
const SEARCH_SYMBOLS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC", "SBIN", "BHARTIARTL", "LICI",
    "KOTAKBANK", "LT", "HCLTECH", "TATAMOTORS", "AXISBANK", "SUNPHARMA", "MARUTI", "BAJFINANCE", "ASIANPAINT", "TITAN",
    "ULTRACEMCO", "NTPC", "POWERGRID", "M&M", "ONGC", "TATASTEEL", "JSWSTEEL", "ADANIENT", "ADANIPORTS", "COALINDIA",
    "HDFCLIFE", "SBILIFE", "BAJAJFINSV", "BPCL", "GRASIM", "BRITANNIA", "TECHM", "WIPRO", "HINDALCO", "CIPLA",
    "EICHERMOT", "DRREDDY", "DIVISLAB", "TATACONSUM", "APOLLOHOSP", "HEROMOTOCO", "UPL"
];

type WatchlistProps = {
    onSelectSymbol: (symbol: string) => void;
};

export default function Watchlist({ onSelectSymbol }: WatchlistProps) {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();
    
    const [stocks, setStocks] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    // Filter search results
    useEffect(() => {
        if (!search) {
            setSearchResults([]);
            return;
        }
        const query = search.toUpperCase();
        const results = SEARCH_SYMBOLS.filter(s => s.includes(query) && !stocks.includes(s)).slice(0, 5);
        setSearchResults(results);
    }, [search, stocks]);

    // Fetch mock prices for watched stocks
    useEffect(() => {
         if (stocks.length === 0) return;

         const fetchPrices = async () => {
            // In a real app, we would use a batch API. Here we mock or loop.
            // Using loop with existing endpoint: /market/live?symbol=...
            const newPrices: Record<string, any> = {};
            
            await Promise.all(stocks.map(async (symbol) => {
                try {
                    // For now, let's mock the price change since the backend only returns current price
                    // Or if backend returns existing day change, use it.
                    // Assuming /market/live returns { data: { price: number, ... } }
                    const res = await fetchWithAuth(`/market/live?symbol=${symbol}`);
                    if (res?.data?.price) {
                         // Mocking change for demo interaction
                         const mockChange = (Math.random() * 4 - 2); 
                         newPrices[symbol] = { 
                             price: res.data.price,
                             change: mockChange // Mock percentage change
                         };
                    }
                } catch (e) {
                    console.error(`Failed to fetch price for ${symbol}`, e);
                }
            }));
            setPrices(prev => ({ ...prev, ...newPrices }));
         };

         fetchPrices();
         const interval = setInterval(fetchPrices, 10000); // Update every 10s
         return () => clearInterval(interval);
    }, [stocks, token]);

    useEffect(() => {
        const saved = localStorage.getItem("watchlist");
        if (saved) {
            setStocks(JSON.parse(saved));
        } else {
            setStocks(["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("watchlist", JSON.stringify(stocks));
    }, [stocks]);

    const addStock = (symbolParam?: string) => {
        const symbol = symbolParam || search.toUpperCase();
        if (!symbol) return;
        
        if (!stocks.includes(symbol)) {
            setStocks([...stocks, symbol]);
        }
        setSearch("");
        setSearchResults([]);
        setIsAdding(false);
    };

    const removeStock = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStocks(stocks.filter(s => s !== symbol));
        // Cleanup price
        const newPrices = { ...prices };
        delete newPrices[symbol];
        setPrices(newPrices);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
             if (searchResults.length > 0) {
                addStock(searchResults[0]);
             } else {
                addStock();
             }
        }
    };
    
    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsAdding(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mt-8 px-2">
            <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Watchlist
                </h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1 hover:bg-white/10 rounded-md transition text-white/50 hover:text-white"
                >
                    <Plus size={14} />
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 px-1 overflow-visible relative z-20"
                        ref={searchRef}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search symbol..."
                                className="w-full bg-[#1A1D26] border border-white/10 rounded-md py-1.5 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                autoFocus
                            />
                            <Search size={12} className="absolute left-2.5 top-2.5 text-white/30" />
                        </div>

                        {/* Dropdown Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D26] border border-white/10 rounded-md shadow-xl overflow-hidden">
                                {searchResults.map(res => (
                                    <div 
                                        key={res}
                                        onClick={() => addStock(res)}
                                        className="px-3 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer flex items-center justify-between"
                                    >
                                        <span>{res}</span>
                                        <Plus size={12} className="text-white/30" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-1">
                {stocks.map((symbol) => (
                    <motion.div
                        key={symbol}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => onSelectSymbol(symbol)}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition relative"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${
                                (prices[symbol]?.change || 0) >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                                {(prices[symbol]?.change || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                                <div className="text-sm text-white/80 font-medium leading-none mb-0.5">
                                    {symbol}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono">
                                    {prices[symbol] ? `₹${prices[symbol].price.toFixed(2)}` : "—"}
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={(e) => removeStock(symbol, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-400 text-white/20 rounded-md transition"
                        >
                            <Trash2 size={12} />
                        </button>
                    </motion.div>
                ))}
                
                {stocks.length === 0 && (
                    <div className="text-xs text-white/30 text-center py-4">
                        No stocks in watchlist
                    </div>
                )}
            </div>
        </div>
    );
}
