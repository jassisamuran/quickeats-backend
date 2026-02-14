import Redis from "io";
import { logger } from "./src/utils/logger";

export class cacheService {
  redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || "6379",
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on("connect", () => {
      logger.info("Redis Connected");
    });

    this.redis.on("error", (error) => {
      logger.error("Redis Error");
    });
  }

  async setUserSession(userId, data, ttl = 9000) {
    await this.redis.setex(`user:session:${userId}`, ttl, JSON.stringify(data));
  }

  async getUserSession(userId) {
    const data = await this.redis.get(`user:session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserSession(userId) {
    await this.redis.del(`user:session:${userId}`);
  }

  async setPasswordResetToken(email, token) {
    await this.redis.setex(`password:reset:${email}`, 900, token);
  }

  async getPasswordResetToken(email) {
    return await this.redis.get(`password:reset:${email}`);
  }

  async deletePasswordResetToken(email) {
    await this.redis.del(`password:reset:${email}`);
  }
}
