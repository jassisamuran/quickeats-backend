import crypto from "crypto";
import Razorpay from "razorpay";
import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
export default class RazorPayService {
  razorpay;

  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.warn("Razorpay credentials not configured");
    }
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }

  async createOrder(amount, orderId, currency = "INR") {
    try {
      const options = {
        amount: Math.round(amount * 100),
        currency: currency,
        receipt: orderId,
        notes: {
          orderId: orderId,
          createdAt: new Date().toString(),
        },
      };

      const razopayOrder = await this.razorpay.orders.create(options);
      logger.info(`Razorpay order created: ${razopayOrder.id}`);

      return {
        razorpayOrderId: razopayOrder.id,
        amount: razopayOrder.amount / 100,
        currency: razopayOrder.currency,
        receipt: razopayOrder.receipt,
        status: razopayOrder.status,
      };
    } catch (error) {
      logger.info("Razorpay order creation failed:", error);
      throw new ApiError(500, "Failed to create payment order", error.error);
    }
  }

  verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  ) {
    try {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body.toString())
        .digest("hex");
      return expectedSignature == razorpaySignature;
    } catch (error) {
      logger.error("Signature verification failed:", error);
      return false;
    }
  }

  async capturePayment(paymentId, amount, currency = "INR") {
    try {
      const payment = await this.razorpay.payments.capture(
        paymentId,
        Math.round(amount * 100),
        currency,
      );

      logger.info(`Payment captured: ${paymentId}`);
      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.amount,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
      };
    } catch (error) {
      logger.info("Payment capture failed:", error);
      throw new Error(500, "Failed to capture payment", error.error);
    }
  }

  async fetchPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        id: payment.id,
        orderId: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        cardId: payment.card_id,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        createdAt: new Date(payment.created_at * 1000),
      };
    } catch (error) {
      logger.info("Fetched payment failed:", error);
      throw new ApiError(500, "Failed to fetch payment details", error.error);
    }
  }

  async createRefund(paymentId, amount, reason) {
    try {
      const options = {
        speed: "normal",
      };

      if (amount) {
        options.amount = Math.round(amount * 100);
      }
      if (reason) {
        options.notes = { reason };
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);

      logger.info(`Refund created: ${refund.id}`);

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000),
      };
    } catch (error) {
      logger.info("Refund creation failed:", error);
      throw new ApiError(500, "Failed to create refund", error.error);
    }
  }

  async fetchRefund(refundId) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        speedProcessed: refund.speed_processed,
        cretedAt: new Date(refund.created_at * 1000),
      };
    } catch (error) {
      logger.info("Fetched refund failed:", error);
      throw new ApiError(500, "Failed to fetch refund details", error);
    }
  }

  verifyWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      logger.error("Webhook signature verification failed:", error);
      return false;
    }
  }
}
