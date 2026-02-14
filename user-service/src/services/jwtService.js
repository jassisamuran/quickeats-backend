import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
class JwtService {
  accessTokenSecret;
  refreshTokenSecret;
  accessTokenExpiry;
  refreshTokenExpiry;

  constructor() {
    this.accessTokenSecret =
      process.env.JWT_SECRET || "default-secret-change-me";
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-me";
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || "15m";
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  }

  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role, type: "access" }, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId, type: "refresh" }, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired access token");
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
  }
}

export const jwtService = new JwtService();
