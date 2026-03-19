from app.core.data_builder import build_dataset
from app.core.model import train_model

# Simulated realistic price data
prices = [
    100, 102, 101, 99, 103, 98, 105, 107, 104, 110,
    108, 112, 109, 115, 113, 117, 114, 120, 118, 122
]

X, y = build_dataset(prices)

train_model(X, y)
