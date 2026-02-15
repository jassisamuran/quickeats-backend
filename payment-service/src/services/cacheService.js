import Redis from "ioredis";
import { error } from "winston";
import { logger } from "../utils/logger";

export class CacheService {
  redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || "6379",
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on("connect", () => {
      logger.info("Redis Connect");
    });
    this.redis.on("error", (err) => {
      logger.error("Redis error:", error);
    });
  }

  async cachePayment(paymentId, payment) {
    await this.redis.setex(
      `payment:${paymentId}`,
      3600,
      JSON.stringify(payment),
    );
  }

  async getPayment(paymentId) {
    const data = await this.redis.get(`payment:${paymentId}`);
    return data ? JSON.parse(data) : null;
  }

  async deletePayment(paymentId) {
    await this.redis.del(`payment:${paymentId}`);
  }
}
