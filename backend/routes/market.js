import express from "express";
import { fetchMarketData } from "../services/marketClient.js";
// import { MarketSnapshotSchema } from "../schemas/market_snapshot_schema.js";

const router = express.Router();

router.get("/market/live", async (req, res) => {
  const data = await fetchMarketData();

  console.log("ROUTE DATA:", data);

  res.json({
    success: true,
    received: data,
  });
});


export default router;
