import express from "express";
import marketRoutes from "./routes/market.js";
import healthCheckRoute from "./routes/healthcheck.js";

const app = express();
app.use(express.json());

app.use("/", marketRoutes);
app.use("/", healthCheckRoute);

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

server.on("error", (err) => {
  console.error("Error:", err.message);
});
