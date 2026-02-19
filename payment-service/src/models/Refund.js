import { EntitySchema } from "typeorm";

export const RefundStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
};

export const Refund = new EntitySchema({
  name: "Refund",

  tableName: "refunds",

  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },

    paymentId: {
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
      type: "varchar",
      // varchar: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
    },

    razorpayRefundId: {
      type: "varchar",
      nullable: true,
    },

    reason: {
      type: "text",
      nullable: true,
    },

    initiatedBy: {
      type: "varchar",
      nullable: true,
    },

    errorMessage: {
      type: "text",
      nullable: true,
    },

    processedAt: {
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
    payment: {
      type: "many-to-one",
      target: "Payment",
      joinColumn: {
        name: "paymentId",
      },
      inverseSide: "refunds",
      onDelete: "CASCADE",
    },
  },
});
