
import express from "express";
import Trade from "../schemas/trade_schema.js";
import { safeRedisGet, safeRedisSet } from "../services/redisClient.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// GET /pnl/trades
router.get("/pnl/trades", async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized - no user ID" });
    }

    try {
        // 1. Try Cache
        const cachedTrades = await safeRedisGet(`trades:${userId}`);
        if (cachedTrades) {
            return res.json({
                source: "cache",
                trades: JSON.parse(cachedTrades)
            });
        }

        // 2. Fetch from DB
        const trades = await Trade.find({ userId }).sort({ createdAt: -1 }).limit(100);

        // 3. Set Cache
        await safeRedisSet(`trades:${userId}`, JSON.stringify(trades), "EX", 300); // 5 min expiry optional

        res.json({
            source: "db",
            trades
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch trades" });
    }
});

// GET /pnl/summary
router.get("/pnl/summary", async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized - no user ID" });
    }

    try {
        const trades = await Trade.find({ userId });
        const totalRealizedPnL = trades.reduce((acc, t) => acc + t.realizedPnL, 0);
        const winCount = trades.filter(t => t.realizedPnL > 0).length;
        const totalTrades = trades.length;

        res.json({
            userId,
            totalRealizedPnL,
            totalTrades,
            winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch PnL summary" });
    }
});

export default router;
