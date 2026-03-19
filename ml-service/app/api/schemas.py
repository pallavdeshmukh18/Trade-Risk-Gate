from pydantic import BaseModel
from typing import List


class Position(BaseModel):
    symbol: str
    quantity: float
    prices: List[float]


class PortfolioRequest(BaseModel):
    positions: List[Position]
