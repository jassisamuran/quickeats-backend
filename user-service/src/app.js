import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { register } from "./utils/metrics.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(compression());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "use-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime,
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", "metrics");
  res.end(await register.metrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString,
  });
});

export { app };
