import "dotenv/config";
import { DataSource } from "typeorm";
import Address from "../models/AddressModel.js";
import User from "../models/Usermodal.js";
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User, Address],
  migrations: ["src/migrations/*.js"],
});
