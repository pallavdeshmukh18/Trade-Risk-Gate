import axios from "axios";

const ML_BASE_URL = process.env.ML_BASE_URL;

async function checkHealth() {
    try {
        const res = await axios.get(`${ML_BASE_URL}/health`, {
            timeout: 3000,
        });
        return res.data;
    } catch (err) {
        console.error("Error:", err.message);
        console.error("Response:", err.response?.data);
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
        console.error("Error:", err.message);
        console.error("Response:", err.response?.data);
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
        console.error("Error:", err.message);
        console.error("Response:", err.response?.data);
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
        console.error("Error:", err.message);
        console.error("Response:", err.response?.data);
        throw err;
    }
}

export default {
    checkHealth,
    getRiskAnalysis,
    getTradeImpact,
    predictRisk
};
