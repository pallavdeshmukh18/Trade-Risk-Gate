import express from "express";
import axios from "axios";

const router = express.Router();
const ML_BASE_URL = process.env.ML_BASE_URL;

router.get("/ml-health", async (req, res) => {
    try {
        const response = await axios.get(`${ML_BASE_URL}/health`, {
            timeout: 2000,
        });

        res.json(response.data);
    } catch (err) {
        console.error("Error:", err.message);
        console.error("Response:", err.response?.data);
        res.status(500).json({ error: err.message });
    }
});

export default router;
