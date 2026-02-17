import { EntitySchema } from "typeorm";

export const PaymentStatus = {
  CREATED: "created",
  PENDING: "pending",
  AUTHORIZED: "authorized",
  CAPTURED: "captured",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

const PaymentMethod = {
  CARD: "card",
  UPI: "upi",
  NETBANKING: "netbanking",
  WALLET: "wallet",
  EMI: "emi",
  CASH_ON_DELIVERY: "cod",
};

export const Payment = new EntitySchema({
  name: "Payment",

  tableName: "payments",

  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },

    orderId: {
      type: "uuid",
    },

    userId: {
      type: "uuid",
    },

    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },

    currency: {
      type: "varchar",
      default: "INR",
    },

    status: {
      type: "enum",
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
    },

    paymentMethod: {
      type: "enum",
      enum: Object.values(PaymentMethod),
      nullable: true,
    },

    razorpayOrderId: {
      type: "varchar",
      unique: true,
      nullable: true,
    },

    razorpayPaymentId: {
      type: "varchar",
      nullable: true,
    },

    razorpaySignature: {
      type: "varchar",
      nullable: true,
    },

    paymentDetails: {
      type: "jsonb",
      nullable: true,
    },

    errorCode: {
      type: "varchar",
      nullable: true,
    },

    errorDescription: {
      type: "text",
      nullable: true,
    },

    paidAt: {
      type: "timestamp",
      nullable: true,
    },

    expiresAt: {
      type: "timestamp",
      nullable: true,
    },

    createdAt: {
      type: "timestamp",
      createDate: true,
    },

    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },

  relations: {
    transactions: {
      type: "one-to-many",
      target: "Transaction",
      inverseSide: "payment",
      cascade: true,
    },

    refunds: {
      type: "one-to-many",
      target: "Refund",
      inverseSide: "payment",
      cascade: true,
    },
  },
});
export { PaymentMethod };
