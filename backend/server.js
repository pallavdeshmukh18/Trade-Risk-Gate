import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js"

const app = express();
app.use(express.json());

app.use("/", marketRoutes);
app.use("/", healthCheckRoute);

app.listen(8000, () => {
  console.log("🚀 Gateway running on port 8000");
});
