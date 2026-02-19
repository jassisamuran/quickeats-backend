import { Router } from "express";
import { AppDataSource } from "../database/connection.js";
import { Transaction } from "../models/Transaction.js";

const router = Router();
const transactionReposity = AppDataSource.getRepository(Transaction);

router.get("/payment/:paymentId", async (req, res, next) => {
  try {
    const transactions = await transactionReposity.find({
      where: { paymentId: req.params.paymentId },
      order: { createdAt: "DESC" },
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

export default router;
