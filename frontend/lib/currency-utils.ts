/**
 * Currency utility for Indian stock market (NSE/BSE)
 * All prices are displayed in Indian Rupees (₹)
 */

export function getCurrency(symbol: string): { code: string; symbol: string } {
    // All stocks are in Indian Rupees
    return { code: "INR", symbol: "₹" };
}

/**
 * Formats a price with INR currency symbol
 */
export function formatPrice(price: number | null | undefined, symbol: string): string {
    if (price === null || price === undefined) {
        return "—";
    }
    return `₹${price.toFixed(2)}`;
}

/**
 * Formats a price value with custom decimal places
 */
export function formatPriceWithDecimals(price: number, symbol: string, decimals: number = 2): string {
    return `₹${price.toFixed(decimals)}`;
}
