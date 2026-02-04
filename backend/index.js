import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { startYahooFeed } from "./services/yahooFeed.js";
import tradeRoute from "./routes/place_trade.js";

dotenv.config();

const app = express();
app.use(express.json());

// ROUTES
app.use("/market", marketRoutes);
app.use("/health", healthCheckRoute);
app.use("/paper", tradeRoute)

mongoose
  .connect(process.env.MONGO_URI)
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
