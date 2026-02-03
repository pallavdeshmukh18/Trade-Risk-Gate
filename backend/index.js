import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/", marketRoutes);
app.use("/", healthCheckRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connection Successfull"))
  .catch((err) => console.error("Mongo Error:", err));

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
