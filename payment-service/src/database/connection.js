import { DataSource } from "typeorm";
import { Payment } from "../models/Payment.js";
import { Refund } from "../models/Refund.js";
import { Transaction } from "../models/Transaction.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [Payment, Transaction, Refund],
  migrations: ["src/database/migrations/*.js"],
  subscribers: [],
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
