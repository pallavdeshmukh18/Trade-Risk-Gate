import express from "express";
import { getPortfolioState, syncPortfolioWithMarket } from "../services/portfolioEngine.js";
import Position from "../schemas/position_schema.js";
import { recalcPortfolio } from "../services/portfolioEngine.js";
import authMiddleware from "../middleware/authMiddleware.js";




const router = express.Router();

router.use(authMiddleware);
const TEST_USER = "user_1";

router.get("/state", async (req, res) => {
    try {
        const state = await getPortfolioState(TEST_USER);
        res.json(state);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch portfolio state" });
    }
});
router.get("/positions", async (req, res) => {
    try {
        const positions = await Position.find({ userId: TEST_USER });
        res.json(positions);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch positions" });
    }
});

router.post("/sync", async (req, res) => {
    try {
        const result = await syncPortfolioWithMarket(TEST_USER);
        res.json({
            success: true,
            equity: result.equity,
            unrealizedPnL: result.unrealizedPnL,
            totalExposure: result.totalExposure
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to sync portfolio with market" });
    }
});

export default router;
