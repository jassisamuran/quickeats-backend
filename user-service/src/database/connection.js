import { DataSource } from "typeorm";
import Address from "../models/AddressModel";
import User from "../models/Usermodal";
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV == "development",
  entities: [User, Address],
  migrations: ["src/database/migrations/*.js"],
  subscribers: [],
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
