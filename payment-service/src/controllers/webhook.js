import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

import { AppDataSource } from "../database/connection.js";
import { Payment, PaymentStatus } from "../models/Payment.js";
import { Refund, RefundStatus } from "../models/Refund.js";
import { Transaction, TransactionType } from "../models/Transaction.js";
import RazorPayService from "../services/razorpayService.js";

const paymentRepository = AppDataSource.getRepository(Payment);
const transactionReposity = AppDataSource.getRepository(Transaction);
const refundRepository = AppDataSource.getRepository(Refund);

const razorpayService = new RazorPayService();

export default class WeenHookController {
  async handleRazorpayWebhook(req, res, next) {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const rawBody = req.rawBody;

      if (!signature) {
        throw new ApiError(400, "Missing webhook signature");
      }

      const isValid = razorpayService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isValid) {
        logger.warn("Invalid webhook signature received");
        throw new ApiError(401, "Invalid webhook signature");
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;
      const webhookData = payload.payload;

      logger.info(`Webhook received: ${event}`);

      switch (event) {
        case "payment.authorized":
          await this.handlePaymentAuthorized(webhookData.payment.entity);
          break;

        case "payment.captured":
          await this.handlePaymentCaptured(webhookData.payment.entity);
          break;

        case "payment.failed":
          await this.handlePaymentFailed(webhookData.payment.entity);
          break;

        case "refund.created":
          await this.handleRedfundCreated(webhookData.refund.entity);
          break;

        case "refund.processed":
          await this.handleRefundProcessed(webhookData.refund.entity);
          break;

        case "refund.failed":
          await this.handleRefundFailed(webhookData.refund.entity);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event}`);
      }
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error("Webhook processing error:", error);
      res.status(200).json({ success: false });
    }
  }
  async handlePaymentAuthorized(paymentData) {
    const payment = await paymentRepository.findOne({
      where: { razorpayOrderId: paymentData.order_id },
    });

    if (!payment) {
      logger.warn(`Payment not found for order: ${paymentData.order_id}`);
      return;
    }

    payment.status = PaymentStatus.AUTHORIZED;
    payment.razorpayPaymentId = paymentData.id;
    await paymentRepository.save(payment);

    await transactionReposity.save(
      transactionReposity.create({
        paymentId: payment.id,
        type: TransactionType.PAYMENT_AUTHORIZED,
        amount: paymentData.currency,
        razorpayId: paymentData.id,
        metadata: paymentData,
        notes: "Payment authorized via webhook",
      }),
    );
    logger.info(`Payment authorized: ${payment.id}`);
  }

  async handlePaymentCaptured(paymentData) {
    const payment = await paymentRepository.findOne({
      where: { razorpayPaymentId: paymentData.id },
    });

    if (!payment) {
      logger.warn(`Payment not found for Razorpay payment: ${paymentData.id}`);
    }

    if (payment.status === PaymentStatus.CAPTURED) {
      logger.info(`Payment already captured: ${payment.id}`);
    }

    payment.status = PaymentStatus.CAPTURED;
    payment.paymentMethod = paymentData.method;
    payment.paymentDetails = {
      cardLast4: paymentData.card?.last4,
      cardNetwork: paymentData.card?.network,
      cardType: paymentData.card?.type,
      bank: paymentData.bank,
      wallet: paymentData.wallet,
      vpa: paymentData.vpa,
      email: paymentData.email,
      contact: paymentData.contact,
    };

    payment.paidAt = new Date(paymentData.created_at * 1000);
    await paymentRepository.save(payment);

    await transactionReposity.save(
      transactionReposity.create({
        paymentId: payment.id,
        type: paymentData.amount / 100,
        amount: paymentData.amount / 100,
        currency: paymentData.currency,
        razorpayId: paymentData.id,
        metadata: paymentData,
        notes: "Payment captured via webhook",
      }),
    );
    logger.info(`Payment captured via webhook: ${payment.id}`);
  }

  async handlePaymentFailed(paymentData) {
    const payment = await paymentRepository.findOne({
      where: {
        razorpayOrderId: paymentData.order_id,
      },
    });

    if (!payment) {
      logger.warn(`Payment not found for order: ${paymentData.order_id}`);
    }

    payment.status = PaymentStatus.FAILED;
    payment.razorpayPaymentId = payment.id;
    payment.errorCode = paymentData.error_code;
    payment.errorDescription = paymentData.error_description;
    await paymentRepository.save(payment);

    await transactionReposity.save(
      transactionReposity.create({
        paymentId: payment.id,
        type: TransactionType.PAYMENT_FAILED,
        amount: paymentData.amount / 100,
        currency: paymentData.currency,
        razorpayId: payment.id,
        metadata: paymentData,
        notes: `Payment failed: ${paymentData.error_description}`,
      }),
    );

    logger.info(`Payment failed via webhook: ${payment.id}`);
  }

  async handleRedfundCreated(refundData) {
    const payment = await paymentRepository.findOne({
      where: {
        razorpayOrderId: refundData.payment_id,
      },
    });

    if (!payment) {
      logger.warn(`Payment not found for refund: ${refundData.payment_id}`);
      return;
    }

    let refund = await refundRepository.findOne({
      where: { razorpayRefundId: refundData.id },
    });

    if (!refundData) {
      refund = refundData.create({
        paymentId: payment.id,
        amount: refundData.amount / 100,
        currency: refundData.currency,
        status: RefundStatus.PROCESSED,
        razorpayRefundId: refundData.id,
      });

      await refundRepository.save(refund);
    }

    logger.info(`Refund created via webhook: ${refund.id}`);
  }

  async handleRefundProcessed(refundData) {
    const refund = await refundRepository.findOne({
      where: { razorpayRefundId: refundData.id },
    });

    if (!refund) {
      logger.warn(`Refund not found: ${refundData}`);
    }

    refund.status = RefundStatus.PROCESSED;
    refund.processedAt = new Date(refundData.created_at * 1000);
    await refundData.save(refund);

    await transactionReposity.save(
      transactionReposity.create({
        paymentId: refund.paymentId,
        type: TransactionType.REFUND_PROCESSED,
        amount: refundData.amount / 100,
        currency: refundData.currency,
        razorpayId: refundData.id,
        metadata: refundData,
        notes: "Refund processed successfully",
      }),
    );
    logger.info(`Refund processed via webhook: ${refund.id}`);
  }
  async handleRefundFailed(refundData) {
    const refund = await refundRepository.findOne({
      where: { razorpayRefundId: refundData.id },
    });

    if (!refund) {
      logger.warn(`Refund not found: ${refundData.id}`);
      return;
    }

    refund.status = RefundStatus.FAILED;
    refund.errorMessage = "Refund processing failed";
    await refundRepository.save(refund);

    await transactionReposity.save(
      transactionReposity.create({
        paymentId: refund.paymentId,
        type: TransactionType.REFUND_FAILED,
        amount: refundData.amount / 100,
        currency: refundData.currency,
        razorpayId: refundData.id,
        metadata: refundData,
        notes: "Refund failed",
      }),
    );

    logger.info(`Refund failed via webhook: ${refund.id}`);
  }
}
