
import express from "express";
import Trade from "../schemas/trade_schema.js";
import redis from "../services/redisClient.js";

const router = express.Router();

// GET /pnl/trades?userId=...
router.get("/pnl/trades", async (req, res) => {
    const userId = req.query.userId || req.query.userID;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    try {
        // 1. Try Cache
        const cachedTrades = await redis.get(`trades:${userId}`);
        if (cachedTrades) {
            return res.json({
                source: "cache",
                trades: JSON.parse(cachedTrades)
            });
        }

        // 2. Fetch from DB
        const trades = await Trade.find({ userId }).sort({ createdAt: -1 }).limit(100);

        // 3. Set Cache
        await redis.set(`trades:${userId}`, JSON.stringify(trades), "EX", 300); // 5 min expiry optional

        res.json({
            source: "db",
            trades
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch trades" });
    }
});

// GET /pnl/summary?userId=...
router.get("/pnl/summary", async (req, res) => {
    const userId = req.query.userId || req.query.userID;
     if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
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
