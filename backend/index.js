import { dirname, join } from "path";
import express from "express";
import cors from "cors";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { startYahooFeed } from "./services/yahooFeed.js";
import tradeRoute from "./routes/place_trade.js";
import portfolioRoutes from "./routes/portfolio.js";
import chartRoutes from "./routes/chart.js";
import watchlistRoutes from "./routes/watchlist.js";
import searchRoutes from "./routes/search.js";

import authRoutes from "./routes/auth.js";
import getOrder from './routes/getOrders.js';
import pnlRoutes from './routes/pnl.js';

import mlTestRoutes from "./routes/mlTest.js";
import riskRoutes from "./routes/risk.js";
import tradeImpactRoutes from "./routes/tradeImpact.js";
import predictRoutes from "./routes/predict.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI missing");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

if (!process.env.ML_BASE_URL) {
  throw new Error("ML_BASE_URL missing");
}

if (!process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL missing");
}

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = [
  "http://localhost:3000",
  "https://trade-risk-gate.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/api", predictRoutes);
app.use("/api", tradeImpactRoutes);
app.use("/api", riskRoutes);
app.use("/api", mlTestRoutes);

// PUBLIC ROUTES
app.use("/auth", authRoutes);
app.use("/market", marketRoutes);
app.use("/chart", chartRoutes);
app.use("/health", healthCheckRoute);
app.use("/paper", tradeRoute);
app.use("/search", searchRoutes);
app.use("/paper", getOrder);

// PROTECTED DOMAIN ROUTES
app.use("/portfolio", portfolioRoutes); // Note: portfolioRoutes mounts confirm logic
app.use("/stats", pnlRoutes);
app.use("/watchlist", watchlistRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "riskgate",
  })
  .then(async () => {
    console.log("Mongo connected");
    await startYahooFeed();
    console.log("Yahoo market feed started");
  })
  .catch((err) => {
    console.error("Error:", err.message);
    console.error("Response:", err.response?.data);
  });

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

server.on("error", (err) => {
  console.error("Error:", err.message);
});
