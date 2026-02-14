import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { AppDataSource } from "./database/connection.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await AppDataSource.initialize();
    logger.info("Database connected successfully");

    await AppDataSource.runMigrations();
    logger.info("Database migrations completed");

    app.listen(PORT, () => {
      logger.info(`🚀 User Service running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Database: ${process.env.DATABASE_URL?.split("@")[1]}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();
