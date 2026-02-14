import bcrypt from "bcrypt";
import { AppDataSource } from "../database/connection.js";
import User from "../models/Usermodal.js";
import { cacheService } from "../services/cacheService.js";
import { jwtService } from "../services/jwtService.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
const userRepository = AppDataSource.getRepository(User);

export class AuthController {
  async signup(req, res, next) {
    console.log("req.body", req.body);
    try {
      const { email, password, fullName, phone, role } = req.body;
      const exitingUser = await userRepository.findOne({
        where: [{ email }, { phone }],
      });
      console.log("req.body", req.body);

      if (exitingUser) {
        throw new ApiError(400, "User with this email or phone already exits");
      }
      const user = userRepository.create({
        email,
        password,
        fullName,
        phone,
        role: role || "customer",
        preferences: {
          language: "en",
          currency: "INR",
          notifications: {
            emai: true,
            sms: true,
            push: true,
          },
        },
      });
      console.log("user is", user);
      await userRepository.save(user);

      const accessToken = jwtService.generateAccessToken(user.id, user.role);
      const refreshToken = jwtService.generateRefreshToken(user.id);

      user.refreshToken = refreshToken;
      await userRepository.save(user);

      await cacheService.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`New user registered: ${user.email}`);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log("re1", req.body);

      const user = await userRepository.findOne({
        where: { email },
        select: ["id", "email", "password", "phone", "role", "isActive"],
      });
      console.log("re2", req.body);

      if (!user) {
        throw new ApiError(401, "Invalid email or password");
      }

      if (!user.isActive) {
        throw new ApiError(403, "You account has been deactivated.");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (password !== user.password) {
        throw new ApiError(401, "Invalid email or password");
      }

      const accessToken = jwtService.generateAccessToken(user.id, user.role);
      const refreshToken = jwtService.generateRefreshToken(user.id);

      user.refreshToken = refreshToken;
      user.lastLoginAt = new Date();
      await userRepository.save(user);

      await cacheService.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.log("login error", error);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ApiError(400, "Refresh token is required");
      }

      const decoded = jwtService.verifyRefreshToken(refreshToken);

      const user = await userRepository.findOne({
        where: { id: decoded.userId },
        select: ["id", "email", "role", "refreshToken", "isActive"],
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Invalid refresh token");
      }

      if (!user.isActive) {
        throw new ApiError(403, "Accound Deactivated");
      }

      const accessToken = jwtService.generateAccessToken(user.id, user.role);

      res.json({
        success: true,
        data: {
          accessToken,
        },
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user?.userId;

      console.log("now", req.user);
      if (userId) {
        console.log("now2");
        await userRepository.update(userId, { refreshToken: null });
        console.log("now3");

        await cacheService.deleteUserSession(userId);
        console.log("now4");

        logger.info(`User logged out: ${userId}`);

        res.json({
          success: true,
          message: "Logout successful",
        });
      }
    } catch (error) {
      console.log("error", error);
      next(error);
    }
  }

  async forgetPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.json({
          success: true,
          message:
            "If your email is registered, you will receive a password reset link",
        });
      }

      const resetToken = Math.floor(1000000 + Math.random() * 9000000);

      await cacheService.setPasswordResetToken(email, resetToken);

      logger.info(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link",
        ...(process.env.NODE_ENV === "development" && { resetToken }),
      });
    } catch (error) {}
  }

  async resetPassword(req, res) {
    try {
      const { email, token, newPassword } = req.body;
      const storedToken = await cacheService.getPasswordResetToken(email);

      if (!storedToken || storedToken !== token) {
        throw new ApiError(400, "Invalid or expired reset token");
      }

      const user = await userRepository.findOne({ where: { email } });
      4;

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      user.password = newPassword;

      await userRepository.save(user);

      await cacheService.deletePasswordResetToken(email);

      logger.info(`Password reset successful for: ${email}`);

      res.json({
        succes: true,
        message:
          "Password reset successful. Please login with your new password.",
      });
    } catch (error) {
      next(error);
    }
  }
}
