import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";
import mongoose, { get } from "mongoose";
import dotenv from "dotenv";
import { startYahooFeed } from "./services/yahooFeed.js";
import tradeRoute from "./routes/place_trade.js";
import portfolioRoutes from "./routes/portfolio.js";

import authRoutes from "./routes/auth.js";
import getOrder from './routes/getOrders.js';
import pnlRoutes from './routes/pnl.js';


dotenv.config();

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// PUBLIC ROUTES
app.use("/auth", authRoutes);
app.use("/market", marketRoutes);
app.use("/health", healthCheckRoute);
app.use("/paper", tradeRoute);
app.use("/paper", getOrder);

// PROTECTED DOMAIN ROUTES
app.use("/portfolio", portfolioRoutes); // Note: portfolioRoutes mounts confirm logic
app.use("/stats", pnlRoutes);


mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "riskgate",
  })
  .then(async () => {
    console.log("Mongo connected");
    await startYahooFeed();
    console.log("Yahoo market feed started");
  })
  .catch((err) => console.error("Mongo Error:", err));

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
