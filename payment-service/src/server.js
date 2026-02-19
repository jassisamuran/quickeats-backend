import "dotenv/config";
import { app } from "./app.js";
import { AppDataSource } from "./database/connection.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 3006;

async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info("✅ Database connected successfully");

    // Run migrations
    await AppDataSource.runMigrations();
    logger.info("✅ Database migrations completed");

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Payment Service running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(
        `💳 Razorpay: ${process.env.RAZORPAY_KEY_ID ? "Configured" : "Not Configured"}`,
      );
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();
