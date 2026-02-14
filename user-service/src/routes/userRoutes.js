import { Router } from "express";
import { UserController } from "../controllers/user";
import { authenticate } from "../middleware/auth";

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.get("/address", userController.getAddresses);
router.post("/address", userController.addAddress);

export default router;
