from app.services.risk_service import analyze_portfolio
from app.core.trade_simulator import simulate_trade


def analyze_trade_impact(positions, trade):
    safe_positions = positions if isinstance(positions, list) else []
    safe_trade = trade if isinstance(trade, dict) else {}

    # Risk BEFORE
    before = analyze_portfolio(safe_positions)

    # Simulate trade
    updated_positions = simulate_trade(safe_positions, safe_trade)

    # Risk AFTER
    after = analyze_portfolio(updated_positions)

    delta = after["riskScore"] - before["riskScore"]

    # Simple warning logic
    if delta > 10:
        warning = "High risk increase"
    elif delta > 3:
        warning = "Moderate risk increase"
    else:
        warning = "Low impact"

    return {
        "beforeRisk": before["riskScore"],
        "afterRisk": after["riskScore"],
        "delta": round(delta, 2),
        "warning": warning
    }
