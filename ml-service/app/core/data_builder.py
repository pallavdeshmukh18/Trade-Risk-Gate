import numpy as np


def calculate_returns(prices):
    return np.diff(prices) / prices[:-1]


def build_dataset(prices, window=5):
    X = []
    y = []

    for i in range(window, len(prices) - 2):
        window_prices = prices[i - window:i]

        returns = calculate_returns(window_prices)

        volatility = np.std(returns)
        mean_return = np.mean(returns)
        momentum = window_prices[-1] - window_prices[0]

        # future return (next 2 steps)
        future_return = (prices[i + 2] - prices[i]) / prices[i]

        label = 1 if future_return < 0 else 0

        X.append([volatility, mean_return, momentum])
        y.append(label)

    return np.array(X), np.array(y)
