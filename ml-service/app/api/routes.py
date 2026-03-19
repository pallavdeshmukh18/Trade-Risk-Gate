from app.services.predict_service import predict_portfolio_risk
import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.services.risk_service import analyze_portfolio
from app.services.trade_service import analyze_trade_impact

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/risk")
async def get_risk(request: Request):
    try:
        raw_body = await request.body()
        print("📥 /risk raw body:", raw_body.decode("utf-8", errors="replace"))

        if not raw_body:
            return JSONResponse(
                status_code=400,
                content={"error": "Request body is required"},
            )

        data = json.loads(raw_body)
        print("📥 /risk parsed data:", data)

        if not isinstance(data, dict):
            return JSONResponse(
                status_code=400,
                content={"error": "JSON body must be an object"},
            )

        positions = data.get("positions", [])
        if not isinstance(positions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "'positions' must be a list"},
            )

        return analyze_portfolio(positions)
    except json.JSONDecodeError as exc:
        print("❌ /risk JSON decode error:", str(exc))
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid JSON body"},
        )
    except Exception as exc:
        print("❌ /risk unexpected error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to analyze portfolio"},
        )


@router.post("/trade-impact")
async def trade_impact(request: Request):
    try:
        raw_body = await request.body()
        print("📥 /trade-impact raw body:",
              raw_body.decode("utf-8", errors="replace"))

        if not raw_body:
            return JSONResponse(
                status_code=400,
                content={"error": "Request body is required"},
            )

        data = await request.json()
        print("📥 /trade-impact parsed data:", data)

        if not isinstance(data, dict):
            return JSONResponse(
                status_code=400,
                content={"error": "JSON body must be an object"},
            )

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
    except json.JSONDecodeError as exc:
        print("❌ /trade-impact JSON decode error:", str(exc))
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid JSON body"},
        )
    except Exception as exc:
        print("❌ /trade-impact unexpected error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to analyze trade impact"},
        )


@router.post("/predict-risk")
async def predict_risk(request: Request):
    try:
        raw_body = await request.body()
        print("📥 /predict-risk raw body:",
              raw_body.decode("utf-8", errors="replace"))

        if not raw_body:
            return JSONResponse(
                status_code=400,
                content={"error": "Request body is required"},
            )

        data = await request.json()
        print("📥 /predict-risk parsed data:", data)

        if not isinstance(data, dict):
            return JSONResponse(
                status_code=400,
                content={"error": "JSON body must be an object"},
            )

        positions = data.get("positions", [])
        if not isinstance(positions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "'positions' must be a list"},
            )

        return predict_portfolio_risk(positions)
    except json.JSONDecodeError as exc:
        print("❌ /predict-risk JSON decode error:", str(exc))
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid JSON body"},
        )
    except Exception as exc:
        print("❌ /predict-risk unexpected error:", str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to predict portfolio risk"},
        )
