import numpy as np

# 1. returns


def calculate_returns(prices):
    prices = np.array(prices)
    return np.diff(prices) / prices[:-1]

# 2. volatility


def calculate_volatility(returns):
    return np.std(returns)

# 3. Value at Risk (VaR)


def calculate_var(returns, confidence=0.95):
    return np.percentile(returns, (1 - confidence) * 100)

# 4. drawdown


def calculate_drawdown(prices):
    peak = prices[0]
    max_dd = 0

    for price in prices:
        if price > peak:
            peak = price
        dd = (price - peak) / peak
        if dd < max_dd:
            max_dd = dd

    return max_dd
