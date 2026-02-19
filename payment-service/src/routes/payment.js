import { Router } from "express";
import { PaymentController } from "../controllers/Payment.js";
const router = Router();
const paymentController = new PaymentController();

router.post("/create-order", paymentController.createOrder);

router.post("/verify", paymentController.verifyPayment);

router.get("/:paymentId", paymentController.getPayment);

router.get("/order/:orderId", paymentController.getPaymentByOrder);

router.post("/:paymentId/refund", paymentController.createRefund);

router.get("/user/:userId", paymentController.getUserPayments);

export default router;
