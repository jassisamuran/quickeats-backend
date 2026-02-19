import { Router } from "express";
import WebhookController from "../controllers/webhook.js";

const router = Router();
const webhookController = new WebhookController();

router.use((req, res, next) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
});

router.post("/razorpay", webhookController.handleRazorpayWebhook);

export default router;
