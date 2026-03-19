from app.core.risk_calculations import (
    calculate_returns,
    calculate_volatility,
    calculate_var,
    calculate_drawdown,
)


def analyze_portfolio(positions):
    weighted_returns = []

    total_value = 0
    position_values = []

    # Step 1: compute position values
    for pos in positions:
        prices = pos.get("prices", [])
        qty = pos.get("quantity", 0)

        if len(prices) < 2:
            continue

        latest_price = prices[-1]
        value = qty * latest_price

        position_values.append((pos, value))
        total_value += value

    # Step 2: compute weighted returns
    for pos, value in position_values:
        weight = value / total_value if total_value > 0 else 0

        returns = calculate_returns(pos["prices"])

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
        calculate_drawdown(pos["prices"])
        for pos, _ in position_values
    ]

    max_drawdown = min(drawdowns)

    risk_score = min(100, abs(var) * 1000 + volatility * 100)

    return {
        "riskScore": round(risk_score, 2),
        "volatility": round(volatility, 4),
        "var": round(var, 4),
        "drawdown": round(max_drawdown, 4),
    }
