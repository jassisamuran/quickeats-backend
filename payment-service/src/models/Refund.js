const { EntitySchema } = require("typeorm");

const RefundStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
};

const Refund = new EntitySchema({
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
      type: "enum",
      enum: Object.values(RefundStatus),
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

module.exports = {
  Refund,
  RefundStatus,
};
