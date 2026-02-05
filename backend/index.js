import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { startYahooFeed } from "./services/yahooFeed.js";
import tradeRoute from "./routes/place_trade.js";
import portfolioRoutes from "./routes/portfolio.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

// PUBLIC ROUTES
app.use("/auth", authRoutes);
app.use("/market", marketRoutes);
app.use("/health", healthCheckRoute);
app.use("/paper", tradeRoute)

// PROTECTED DOMAIN ROUTES
app.use("/portfolio", portfolioRoutes);

mongoose
<<<<<<< HEAD
  .connect(process.env.MONGO_URI, {
    dbName: "riskgate",
  })
=======
  .connect(process.env.MONGO_URI, { dbName: "riskgate" })
>>>>>>> 615d57561856c30aa6db970f7b246f03f0eeff14
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
