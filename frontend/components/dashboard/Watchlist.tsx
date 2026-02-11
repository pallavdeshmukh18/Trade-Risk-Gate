import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Activity, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/currency-utils";

// Blocked symbols (international stocks)
const BLOCKED_SYMBOLS = new Set([
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "INTC",
    "JPM", "BAC", "WFC", "V", "MA", "WMT", "DIS", "COCA", "PEP", "MCD",
    "^GSPC", "^DJI", "^IXIC"
]);

function isBlocked(symbol: string): boolean {
    return BLOCKED_SYMBOLS.has(symbol.toUpperCase());
}

type SearchResult = {
    symbol: string;
    name: string;
    type?: string;
    exchange?: string;
};

type StockData = {
    price: number;
    changePercent: number;
    changeValue: number;
    open: number;
};

type WatchlistProps = {
    onSelectSymbol: (symbol: string) => void;
    isFullPage?: boolean;
};

export default function Watchlist({ onSelectSymbol, isFullPage = false }: WatchlistProps) {
    const { token } = useAuth();
    const { fetchWithAuth } = useFetch();

    const [stocks, setStocks] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoadedRef = useRef(false);

    // Fetch search suggestions as user types (with debouncing)
    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!search || search.length < 1) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        // Debounce search - wait 300ms after user stops typing
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/search/stocks?q=${encodeURIComponent(search)}`
                );
                const data = await response.json();

                // Filter out stocks already in watchlist
                const filteredResults = (data.results || []).filter(
                    (result: SearchResult) => !stocks.includes(result.symbol)
                );

                setSearchResults(filteredResults);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, stocks]);

    // Fetch watchlist from database on mount
    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const res = await fetchWithAuth('/watchlist');
                if (res?.watchlist) {
                    setStocks(res.watchlist);
                }
            } catch (error) {
                console.error('Failed to fetch watchlist:', error);
                // Start with empty watchlist - users can add their own stocks
                setStocks([]);
            } finally {
                setIsLoading(false);
                hasLoadedRef.current = true;
            }
        };

        if (token && isLoading) {
            fetchWatchlist();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Save watchlist to database whenever it changes
    useEffect(() => {
        // Don't save on initial load or when still loading
        if (!hasLoadedRef.current || !token) return;

        const saveWatchlist = async () => {
            try {
                console.log('Saving watchlist:', stocks);
                await fetchWithAuth('/watchlist', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ watchlist: stocks }),
                });
                console.log('Watchlist saved successfully');
            } catch (error) {
                console.error('Failed to save watchlist:', error);
            }
        };

        saveWatchlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks, token]);

    // Fetch live prices and calculate day's change for watched stocks
    useEffect(() => {
        if (stocks.length === 0) return;

        const fetchStockData = async () => {
            const newStockData: Record<string, StockData> = {};

            await Promise.all(stocks.map(async (symbol) => {
                try {
                    const res = await fetchWithAuth(`/market/live?symbol=${symbol}`);
                    if (res?.data) {
                        const currentPrice = res.data.price;
                        const candles = res.data.candles || [];

                        // Get today's opening price (first candle of today or latest available)
                        let openPrice = currentPrice;
                        if (candles.length > 0) {
                            // Get the most recent candle's open price as reference
                            const latestCandle = candles[candles.length - 1];
                            openPrice = latestCandle.open || currentPrice;
                        }

                        const changeValue = currentPrice - openPrice;
                        const changePercent = openPrice > 0 ? (changeValue / openPrice) * 100 : 0;

                        newStockData[symbol] = {
                            price: currentPrice,
                            changePercent,
                            changeValue,
                            open: openPrice
                        };
                    }
                } catch (e) {
                    console.error(`Failed to fetch data for ${symbol}`, e);
                }
            }));

            setStockData(prev => ({ ...prev, ...newStockData }));
        };

        fetchStockData();
        const interval = setInterval(fetchStockData, 10000); // Update every 10s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks, token]);

    const addStock = (symbolParam?: string) => {
        const symbol = symbolParam || search.toUpperCase();
        if (!symbol) return;

        // Block known international symbols
        if (isBlocked(symbol)) {
            setAddError(`"${symbol}" is not available in the Indian market. Only NSE/BSE stocks are supported.`);
            setTimeout(() => setAddError(null), 3000);
            return;
        }

        if (!stocks.includes(symbol)) {
            setStocks([...stocks, symbol]);
            setAddError(null);
        }
        setSearch("");
        setSearchResults([]);
        setIsAdding(false);
    };

    const removeStock = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStocks(stocks.filter(s => s !== symbol));
        // Cleanup stock data
        const newStockData = { ...stockData };
        delete newStockData[symbol];
        setStockData(newStockData);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (searchResults.length > 0) {
                addStock(searchResults[0].symbol);
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
        <div className={isFullPage ? "" : "mt-8 px-2"}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                    {isFullPage ? "Your Watchlist" : "Watchlist"}
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition text-indigo-400 hover:text-indigo-300 text-sm"
                >
                    <Plus size={16} />
                    Add Stock
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-visible relative z-20"
                        ref={searchRef}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search stocks (e.g. RELIANCE, TCS, INFY)..."
                                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition"
                                autoFocus
                            />
                            <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
                        </div>

                        {/* Error Message */}
                        {addError && (
                            <div className="mt-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                                <p className="text-xs text-rose-400">{addError}</p>
                            </div>
                        )}

                        {/* Dropdown Results */}
                        {isSearching && search.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0E1018]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden px-3 py-3">
                                <div className="flex items-center gap-2 text-white/50 text-xs">
                                    <div className="animate-spin h-3 w-3 border border-white/30 border-t-transparent rounded-full"></div>
                                    <span>Searching...</span>
                                </div>
                            </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0E1018]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <div
                                        key={result.symbol}
                                        onClick={() => addStock(result.symbol)}
                                        className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition"
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white/90">
                                                {result.symbol}
                                            </div>
                                            <div className="text-xs text-white/50 truncate">
                                                {result.name}
                                                {result.exchange && (
                                                    <span className="ml-2 text-white/30">• {result.exchange}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Plus size={14} className="text-white/30 group-hover:text-indigo-400 transition flex-shrink-0 ml-2" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isSearching && search.length > 0 && searchResults.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0E1018]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden px-4 py-3">
                                <div className="text-white/50 text-xs text-center">
                                    No stocks found. Try a different search.
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {stocks.map((symbol, index) => {
                    const data = stockData[symbol];
                    const isPositive = (data?.changePercent || 0) >= 0;

                    return (
                        <motion.div
                            key={symbol}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                e.currentTarget.style.setProperty(
                                    "--x",
                                    `${e.clientX - rect.left}px`
                                );
                                e.currentTarget.style.setProperty(
                                    "--y",
                                    `${e.clientY - rect.top}px`
                                );
                            }}
                            onClick={() => onSelectSymbol(symbol)}
                            className="group relative rounded-xl overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] backdrop-blur-md border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                            {/* Liquid highlight */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Edge glow */}
                            <div className="absolute inset-0 rounded-xl ring-1 ring-white/5" />

                            <div className="relative z-10 px-5 py-4">
                                <div className="flex items-center justify-between">
                                    {/* Left: Symbol and Icon */}
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isPositive ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                                            {isPositive ? (
                                                <TrendingUp className="text-emerald-400" size={22} />
                                            ) : (
                                                <TrendingDown className="text-rose-400" size={22} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-lg font-semibold text-white/95">
                                                {symbol}
                                            </div>
                                            <div className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                                                <Activity size={11} />
                                                Live Price
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Price */}
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white/95 font-mono">
                                            {data ? formatPrice(data.price, symbol) : "—"}
                                        </div>
                                        {data && (
                                            <div className="text-xs text-white/40 mt-1">
                                                Open: {formatPrice(data.open, symbol)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Change and Delete */}
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            {data ? (
                                                <>
                                                    <div className={`text-xl font-bold mb-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%
                                                    </div>
                                                    <div className={`text-sm font-medium ${isPositive ? "text-emerald-400/70" : "text-rose-400/70"}`}>
                                                        {isPositive ? "+" : ""}{formatPrice(data.changeValue, symbol)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-white/40">—</div>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => removeStock(symbol, e)}
                                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-rose-400 transition-colors duration-200"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {stocks.length === 0 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 px-6 border-2 border-dashed border-white/10 rounded-xl bg-white/5"
                >
                    <div className="text-white/30 text-lg mb-3">No stocks in your watchlist</div>
                    <p className="text-white/20 text-sm mb-4">Start tracking your favorite stocks</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 rounded-lg transition text-sm font-medium"
                    >
                        Add Your First Stock
                    </button>
                </motion.div>
            )}

            {isLoading && (
                <div className="text-center py-12 text-white/40">
                    <div className="inline-block animate-spin h-8 w-8 border-2 border-white/20 border-t-indigo-500 rounded-full mb-2"></div>
                    <div className="text-sm">Loading watchlist...</div>
                </div>
            )}
        </div>
    );
}
