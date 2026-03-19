import axios from "axios";

const ML_BASE_URL = process.env.ML_BASE_URL || "http://127.0.0.1:8001";

async function checkHealth() {
    try {
        const res = await axios.get(`${ML_BASE_URL}/health`, {
            timeout: 3000,
        });
        return res.data;
    } catch (err) {
        console.error("❌ Axios Error:", err.message);
        throw err;
    }
}
async function getRiskAnalysis(portfolioData) {
    try {
        const res = await axios.post(
            `${ML_BASE_URL}/risk`,
            portfolioData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 5000,
            }
        );

        return res.data;
    } catch (err) {
        console.error("❌ ML service error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });
        throw err;
    }
}
async function getTradeImpact(data) {
    try {
        const res = await axios.post(
            `${ML_BASE_URL}/trade-impact`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 5000,
            }
        );

        return res.data;
    } catch (err) {
        console.error("❌ ML trade-impact error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });
        throw err;
    }
}
async function predictRisk(data) {
    try {
        const res = await axios.post(
            `${ML_BASE_URL}/predict-risk`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 5000,
            }
        );

        return res.data;
    } catch (err) {
        console.error("Status:", err.response?.status);
        console.error("Data:", err.response?.data);
        console.error("Message:", err.message);
        throw err;
    }
}

export default {
    checkHealth,
    getRiskAnalysis,
    getTradeImpact,
    predictRisk
};
