import { AppDataSource } from "../database/connection.js";
import { Payment, PaymentStatus } from "../models/Payment.js";
import { Refund, RefundStatus } from "../models/Refund.js";
import { Transaction, TransactionType } from "../models/Transaction.js";
import { CacheService } from "../services/cacheService.js";
import RazorpayService from "../services/razorpayService.js";
import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
const paymentRepository = AppDataSource.getRepository(Payment);
const transactionReposity = AppDataSource.getRepository(Transaction);
const refundRepository = AppDataSource.getRepository(Refund);

const razorpayService = new RazorpayService();
const cacheService = new CacheService();

export class PaymentController {
  async createOrder(req, res, next) {
    try {
      const { orderId, amount, userId } = req.body;

      if (!orderId || !amount || !userId) {
        throw new ApiError(400, "Order ID, amount and user ID are required");
      }

      const exitingPayment = await paymentRepository.findOne({
        where: { orderId },
      });

      if (exitingPayment) {
        throw new ApiError(400, "Payment already exits for this order");
      }

      const razorpayOrder = await razorpayService.createOrder(
        amount,
        orderId,
        process.env.PAYMENT_CURRENCY || "INR",
      );

      const expiresAt = new Date();
      expiresAt.setMilliseconds(
        expiresAt.getMinutes() +
          parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || "15"),
      );

      const payment = paymentRepository.create({
        orderId,
        userId,
        amount,
        currency: razorpayOrder.currency,
        status: PaymentStatus.CREATED,
        razorpayOrderId: razorpayOrder.razorpayOrderId,
        expiresAt,
      });

      await paymentRepository.save(payment);

      const transaction = transactionReposity.create({
        paymentId: payment.id,
        type: TransactionType.PAYMENT_CREATED,
        amount,
        currency: razorpayOrder.currency,
        razorpayId: razorpayOrder.razorpayOrderId,
        notes: "Payment order created",
      });

      await transactionReposity.save(transaction);

      await cacheService.cachePayment(payment.id, payment);

      logger.info(`Payment order created: ${payment.id} for order: ${orderId}`);

      res.status(201).json({
        success: true,
        message: "Payment order created successfully",
        data: {
          paymentId: payment.id,
          razorpayOrderId: razorpayOrder.razorpayOrderId,
          amount: payment.currency,
          currency: payment.currency,
          expiresAt: payment.expiresAt,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const {
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      if (
        !paymentId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        throw new ApiError(
          400,
          "Missing required payment verification parameters",
        );
      }
      const payment = await paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new ApiError(404, "Payment not found");
      }

      if (payment.razorpayOrderId !== razorpayOrderId) {
        throw new ApiError(400, "Order ID mismatch");
      }

      const isValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );

      if (!isValid) {
        payment.status = PaymentStatus.FAILED;
        payment.errorCode = "SIGNATURE_VERIFICATION_FAILED";
        payment.errorDescription = "Payment signature verification failed";
        await paymentRepository.save(payment);

        await transactionReposity.save(
          transactionReposity.create({
            paymentId: payment.id,
            type: TransactionType.PAYMENT_FAILED,
            amount: payment.amount,
            currency: payment.currency,
            notes: "Signature verification failed",
          }),
        );
        throw new ApiError(400, "Payment verification failed");
      }
      const razorpayPaymentDetails =
        await razorpayService.fetchPayment(razorpayPaymentId);

      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = PaymentStatus.CAPTURED;
      payment.paymentMethod = razorpayPaymentDetails.method;
      payment.PaymentStatus = {
        emial: razorpayPaymentDetails.email,
        contact: razorpayPaymentDetails.contact,
        bank: razorpayPaymentDetails.bank,
        wallet: razorpayPaymentDetails.wallet,
        vpa: razorpayPaymentDetails.vpa,
      };

      payment.paidAt = new Date();

      await paymentRepository.save(payment);

      (await transactionReposity.save(transactionReposity)).create({
        paymentId: payment.id,
        type: TransactionType.PAYMENT_CAPTURED,
        amount: payment.amount,
        currency: payment.currency,
        razorpayId: razorpayPaymentId,
        notes: "Payment captured successfully",
      });

      await cacheService.cachePayment(payment.id, payment);

      try {
        await axios.post(
          `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/payment-success`,
          {
            paymentId: payment.id,
            razorpayPaymentId,
            amount: payment.amount,
          },
        );
      } catch (error) {
        logger.error("Failed to notify order service:", error);
      }

      logger.info("Failed to notify order service:", error);

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      let payment = await cacheService.getPayment(paymentId);

      if (!payment) {
        payment = await paymentRepository.findOne({
          where: { id: paymentId },
          relations: ["transactions", "refunds"],
        });
      }

      if (!payment) {
        throw new ApiError(404, "Payment not found");
      }

      await cacheService.cachePayment(paymentId, payment);

      res.json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(error);
    }
  }

  async getPaymentByOrder(req, res, next) {
    try {
      const { orderId } = req.params;

      const payment = await paymentRepository.findOne({
        where: { orderId },
        relations: ["transactions", "refunds"],
      });

      if (!payment) {
        throw new ApiError(404, "Payment not found for this order");
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRefund(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { amount, reason, intiatedBy } = req.body;

      const payment = await paymentRepository.findOne({
        where: { id: paymentId },
        relations: ["refunds"],
      });

      if (!payment) {
        throw new ApiError(404, "Payment not found");
      }

      if (!payment.canBeRefunded) {
        throw new ApiError(400, "Payment cannot be refunded");
      }

      const totalRefunded = payment.refunds
        .filter((r) => r.status === RefundStatus.PROCESSED)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const refundedAmount = amount || Number(payment.amount) - totalRefunded;

      if (refundedAmount > Number(payment.amount) - totalRefunded) {
        throw new ApiError(400, "Refund amount exceeds available amount");
      }

      const razorpayRefund = await razorpayService.createRefund(
        payment.razorpayOrderId,
        amount,
        reason,
      );

      const refund = refundRepository.create({
        paymentId: payment.id,
        amount: refundedAmount,
        currency: payment.currency,
        status: RefundStatus.PROCESSING,
        razorpayRefundId: razorpayRefund.id,
        reason,
        intiatedBy,
      });

      await refundRepository.save(refund);

      const newTotalRefunded = totalRefunded + refundedAmount;

      if (newTotalRefunded >= Number(payment.amount)) {
        payment.status = PaymentStatus.REFUNDED;
      } else {
        payment.status = PaymentStatus.PARTIALLY_REFUNDED;
      }

      await paymentRepository.save(payment);

      await transactionReposity.save(
        transactionReposity.create({
          paymentId: payment.id,
          type: TransactionType.REFUND_INITIATED,
          amount: refundedAmount,
          currency: payment.currency,
          razorpayId: razorpayRefund.id,
          notes: reason || "Refund initiated",
        }),
      );
      await cacheService.deletePayment(paymentId);

      logger.info(`Refund created: ${refund.id} for payment: ${payment.id}`);

      res.status(201).json({
        success: true,
        message: "Refund intiated successfully",
        data: {
          refundId: refund.id,
          amount: refund.amount,
          status: refund.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPayments(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const queryBuilder = paymentRepository
        .createQueryBuilder("payment")
        .where("payment.userId = :userId", { userId })
        .orderBy("payment.createdAt", "DESC")
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit));

      if (status) {
        queryBuilder.andWhere("payment.status = :status", { status });
      }

      const [payments, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
