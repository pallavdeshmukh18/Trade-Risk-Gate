import express from "express";
import { getPortfolioState, syncPortfolioWithMarket } from "../services/portfolioEngine.js";
import Position from "../schemas/position_schema.js";
import { recalcPortfolio } from "../services/portfolioEngine.js";
import authMiddleware from "../middleware/authMiddleware.js";
import redis from "../services/redisClient.js";




const router = express.Router();

router.use(authMiddleware);

router.get("/state", async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized - no user ID" });
        }
        const state = await getPortfolioState(userId);
        res.json(state);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch portfolio state" });
    }
});
router.get("/positions", async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized - no user ID" });
        }
        // 1. Try Cache
        const cachedPositions = await redis.get(`positions:${userId}`);
        if (cachedPositions) {
            return res.json(JSON.parse(cachedPositions));
        }

        // 2. Fetch from DB
        const positions = await Position.find({ userId });

        // 3. Set Cache (e.g. 5 min expiry)
        await redis.set(`positions:${userId}`, JSON.stringify(positions), "EX", 300);

        res.json(positions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch positions" });
    }
});


router.post("/sync", async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized - no user ID" });
        }
        const result = await syncPortfolioWithMarket(userId);
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
