const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

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

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString,
  });
});

export { app };
