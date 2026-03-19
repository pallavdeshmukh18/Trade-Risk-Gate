def simulate_trade(positions, trade):
    safe_positions = positions if isinstance(positions, list) else []
    safe_trade = trade if isinstance(trade, dict) else {}

    symbol = safe_trade.get("symbol")
    quantity = safe_trade.get("quantity", 0)
    trade_prices = safe_trade.get("prices", [])

    if not symbol or not isinstance(quantity, (int, float)):
        return [
            pos for pos in safe_positions
            if isinstance(pos, dict)
        ]

    updated_positions = []
    found = False

    for pos in safe_positions:
        if not isinstance(pos, dict):
            continue

        pos_symbol = pos.get("symbol")
        pos_quantity = pos.get("quantity", 0)
        pos_prices = pos.get("prices", [])

        if not isinstance(pos_quantity, (int, float)):
            pos_quantity = 0
        if not isinstance(pos_prices, list):
            pos_prices = []

        if pos_symbol == symbol:
            new_qty = pos_quantity + quantity

            updated_positions.append({
                "symbol": symbol,
                "quantity": new_qty,
                "prices": pos_prices,
            })

            found = True
        else:
            updated_positions.append({
                "symbol": pos_symbol,
                "quantity": pos_quantity,
                "prices": pos_prices,
            })

    # If new stock
    if not found:
        updated_positions.append({
            "symbol": symbol,
            "quantity": quantity,
            "prices": trade_prices if isinstance(trade_prices, list) else [],
        })

    return updated_positions
