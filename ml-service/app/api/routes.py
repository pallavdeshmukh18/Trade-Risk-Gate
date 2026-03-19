from app.services.predict_service import predict_portfolio_risk
import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.services.risk_service import analyze_portfolio
from app.services.trade_service import analyze_trade_impact

router = APIRouter()


async def parse_request_json(request: Request):
    body = await request.body()

    if not body:
        return None, JSONResponse(
            status_code=400,
            content={"error": "Empty body"},
        )

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None, JSONResponse(
            status_code=400,
            content={"error": "Invalid JSON"},
        )

    if not isinstance(data, dict):
        return None, JSONResponse(
            status_code=400,
            content={"error": "JSON body must be an object"},
        )

    print("Request received:", data)
    return data, None


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/risk")
async def get_risk(request: Request):
    data, error_response = await parse_request_json(request)
    if error_response:
        return error_response

    try:
        positions = data.get("positions", [])
        if not isinstance(positions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "'positions' must be a list"},
            )

        return analyze_portfolio(positions)
    except Exception as exc:
        print("Error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to analyze portfolio"},
        )


@router.post("/trade-impact")
async def trade_impact(request: Request):
    data, error_response = await parse_request_json(request)
    if error_response:
        return error_response

    try:
        positions = data.get("positions", [])
        trade = data.get("trade", {})

        if not isinstance(positions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "'positions' must be a list"},
            )

        if not isinstance(trade, dict):
            return JSONResponse(
                status_code=400,
                content={"error": "'trade' must be an object"},
            )

        return analyze_trade_impact(positions, trade)
    except Exception as exc:
        print("Error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to analyze trade impact"},
        )


@router.post("/predict-risk")
async def predict_risk(request: Request):
    data, error_response = await parse_request_json(request)
    if error_response:
        return error_response

    try:
        positions = data.get("positions", [])
        if not isinstance(positions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "'positions' must be a list"},
            )

        return predict_portfolio_risk(positions)
    except Exception as exc:
        print("Error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to predict portfolio risk"},
        )
