import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/ml-health", async (req, res) => {
    console.log("🔥 route hit");

    try {
        const response = await axios.get("http://127.0.0.1:8000/health", {
            timeout: 2000,
        });

        console.log("✅ ML response:", response.data);
        res.json(response.data);
    } catch (err) {
        console.error("❌ axios failed:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;