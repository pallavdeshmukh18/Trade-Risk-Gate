import numpy as np
from app.core.model import predict
from app.core.data_builder import calculate_returns


def predict_portfolio_risk(positions):
    all_returns = []
    prices_combined = []

    for pos in positions:
        prices = pos.get("prices", [])
        if len(prices) < 2:
            continue

        prices_combined.extend(prices)
        returns = calculate_returns(prices)
        all_returns.extend(returns)

    if len(all_returns) == 0:
        return {"lossProbability": 0, "prediction": "LOW_RISK"}

    volatility = np.std(all_returns)
    mean_return = np.mean(all_returns)
    momentum = prices_combined[-1] - prices_combined[0]

    prob = predict([volatility, mean_return, momentum])

    return {
        "lossProbability": round(prob, 2),
        "prediction": "HIGH_RISK" if prob > 0.6 else "LOW_RISK"
    }
