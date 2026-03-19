import express from "express";
import mlService from "../services/mlService.js";

const router = express.Router();

router.post("/predict-risk", async (req, res) => {
    try {
        console.log("Incoming body:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Empty body" });
        }

        const result = await mlService.predictRisk(req.body);
        res.json(result);
    } catch (err) {
        console.error("FULL ERROR:", err.response?.data || err.message);

        res.status(500).json({
            error: err.message,
            details: err.response?.data,
        });
    }
});

export default router;
