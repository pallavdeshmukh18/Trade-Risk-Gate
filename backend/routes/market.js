import express from "express";
import { fetchMarketData } from "../services/marketClient.js";
import { MarketSnapshotSchema } from "../schemas/market_snapshot_schema.js";

const router = express.Router();

router.get("/market/live", async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({
      error: "MISSING_SYMBOL",
    });
  }

  const snapshot = await fetchMarketData(symbol);

  // Validate outgoing response
  const parsed = MarketSnapshotSchema.safeParse(snapshot);

  if (!parsed.success) {
    return res.status(500).json({
      error: "INVALID_MARKET_SCHEMA",
    });
  }

  res.json(parsed.data);
});

export default router;
