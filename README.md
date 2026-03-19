# LowkeyLoss

“Before you place a trade… we tell you if it’s lowkey loss.”

LowkeyLoss is a trading intelligence platform that helps users understand risk before executing a trade. It combines a modern web dashboard, backend market and portfolio services, and an ML service that evaluates trade risk, impact, and related signals.

## What It Does

- Analyzes trades before execution
- Surfaces risk insights and trade-impact signals
- Tracks portfolio, watchlist, and dashboard views
- Connects UI workflows with backend APIs and ML predictions

## Project Structure

- `frontend/` - Next.js App Router frontend for dashboard, portfolio, watchlist, risk engine, and auth flows
- `backend/` - Express API for auth, portfolio, watchlist, trade placement, search, and risk-related routes
- `ml-service/` - FastAPI + scikit-learn service for prediction and risk scoring workflows

## Quick Start

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

ML service:

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## In Short

Trade Risk Gate is built to answer one question quickly and clearly: should this trade go through, or is it a lowkey loss waiting to happen?
