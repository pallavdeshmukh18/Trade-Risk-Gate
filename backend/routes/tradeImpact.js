import express from "express";
import mlService from "../services/mlService.js";

const router = express.Router();

router.post("/trade-impact", async (req, res) => {
    try {
        console.log("📤 /api/trade-impact request body:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: "Request body is required",
            });
        }

        const result = await mlService.getTradeImpact(req.body);
        res.json(result);
    } catch (err) {
        console.error("❌ /api/trade-impact error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });

        res.status(err.response?.status || 500).json({
            error: "Trade impact analysis failed",
            details: err.response?.data || err.message,
        });
    }
});

export default router;
