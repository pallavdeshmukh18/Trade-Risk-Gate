import express from "express";
import User from "../schemas/user_schema.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /watchlist - Get user's watchlist
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ watchlist: user.watchlist || [] });
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ error: "Failed to fetch watchlist" });
    }
});

// PUT /watchlist - Update user's watchlist
router.put("/", async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { watchlist } = req.body;
        if (!Array.isArray(watchlist)) {
            return res.status(400).json({ error: "Watchlist must be an array" });
        }

        console.log(`Updating watchlist for user ${userId}:`, watchlist);

        const user = await User.findByIdAndUpdate(
            userId,
            { watchlist },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`Watchlist updated successfully:`, user.watchlist);
        res.json({ watchlist: user.watchlist });
    } catch (error) {
        console.error("Error updating watchlist:", error);
        res.status(500).json({ error: "Failed to update watchlist" });
    }
});

export default router;
