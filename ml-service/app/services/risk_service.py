from app.core.risk_calculations import (
    calculate_returns,
    calculate_volatility,
    calculate_var,
    calculate_drawdown,
)


def _safe_numeric_prices(prices):
    if not isinstance(prices, list):
        return []

    valid_prices = []
    for price in prices:
        if isinstance(price, (int, float)) and not isinstance(price, bool):
            valid_prices.append(float(price))

    return valid_prices


def analyze_portfolio(positions):
    weighted_returns = []

    total_value = 0
    position_values = []

    # Step 1: compute position values
    for pos in positions:
        if not isinstance(pos, dict):
            continue

        prices = _safe_numeric_prices(pos.get("prices", []))
        qty = pos.get("quantity", 0)

        if not isinstance(qty, (int, float)) or isinstance(qty, bool):
            continue

        if len(prices) < 2:
            continue

        latest_price = prices[-1]
        value = qty * latest_price

        position_values.append((pos, value))
        total_value += value

    # Step 2: compute weighted returns
    for pos, value in position_values:
        weight = value / total_value if total_value > 0 else 0

        returns = calculate_returns(_safe_numeric_prices(pos.get("prices", [])))

        for r in returns:
            weighted_returns.append(r * weight)

    if len(weighted_returns) == 0:
        return {
            "riskScore": 0,
            "volatility": 0,
            "var": 0,
            "drawdown": 0,
        }

    volatility = calculate_volatility(weighted_returns)
    var = calculate_var(weighted_returns)

    drawdowns = [
        calculate_drawdown(_safe_numeric_prices(pos.get("prices", [])))
        for pos, _ in position_values
        if len(_safe_numeric_prices(pos.get("prices", []))) >= 2
    ]

    max_drawdown = min(drawdowns) if drawdowns else 0

    risk_score = min(100, abs(var) * 1000 + volatility * 100)

    return {
        "riskScore": round(risk_score, 2),
        "volatility": round(volatility, 4),
        "var": round(var, 4),
        "drawdown": round(max_drawdown, 4),
    }
