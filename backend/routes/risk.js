import express from "express";
import mlService from "../services/mlService.js";

const router = express.Router();

router.post("/risk", async (req, res) => {
    try {
        console.log("📤 /api/risk request body:", req.body);

        const result = await mlService.getRiskAnalysis(req.body);

        res.json(result);
    } catch (err) {
        console.error("❌ /api/risk error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });

        res.status(err.response?.status || 500).json({
            error: "Risk analysis failed",
            details: err.response?.data || err.message,
        });
    }
});

export default router;
