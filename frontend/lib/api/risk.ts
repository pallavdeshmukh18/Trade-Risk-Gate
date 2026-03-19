const BASE_URL = "/api/ml";

type RiskPosition = {
    symbol: string;
    quantity: number;
    prices: number[];
};

async function readJsonOrThrow(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(
            typeof data?.error === "string" ? data.error : `HTTP ${response.status}`
        );
    }
    return data;
}

export async function getRisk(positions: RiskPosition[]) {
    const res = await fetch(`${BASE_URL}/risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
    });

    return readJsonOrThrow(res);
}

export async function getTradeImpact(data: { positions: RiskPosition[]; trade: RiskPosition }) {
    const res = await fetch(`${BASE_URL}/trade-impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return readJsonOrThrow(res);
}

export async function getPrediction(positions: RiskPosition[]) {
    const res = await fetch(`${BASE_URL}/predict-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
    });

    return readJsonOrThrow(res);
}
