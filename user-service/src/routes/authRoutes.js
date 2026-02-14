import { Router } from "express";
import { AuthController } from "../controllers/auth.js";

const router = Router();

const authController = new AuthController();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.post("/refresh", authController.refreshToken);

router.post("/logout", authController.logout);

router.post("/forget-password", authController.forgetPassword);

router.post("/reset-password", authController.resetPassword);

export default router;
