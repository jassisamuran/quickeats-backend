import { EntitySchema } from "typeorm";

export const TransactionType = {
  PAYMENT_CREATED: "payment_created",
  PAYMENT_AUTHORIZED: "payment_authorized",
  PAYMENT_CAPTURED: "payment_captured",
  PAYMENT_FAILED: "payment_failed",
  REFUND_INITIATED: "refund_initiated",
  REFUND_PROCESSED: "refund_processed",
  REFUND_FAILED: "refund_failed",
};

export const Transaction = new EntitySchema({
  name: "Transaction",

  tableName: "transactions",

  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },

    paymentId: {
      type: "uuid",
    },

    type: {
      type: "varchar",
      default: Object.values(TransactionType),
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

    razorpayId: {
      type: "varchar",
      nullable: true,
    },

    metadata: {
      type: "jsonb",
      nullable: true,
    },

    notes: {
      type: "text",
      nullable: true,
    },

    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },

  relations: {
    payment: {
      type: "many-to-one",
      target: "Payment",
      joinColumn: {
        name: "paymentId",
      },
      inverseSide: "transactions",
      onDelete: "CASCADE",
    },
  },
});
