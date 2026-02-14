import { AppDataSource } from "../database/connection";
import Address from "../models/AddressModel";
import User from "../models/Usermodal";

const userRepository = AppDataSource.getRepository(User);
const addressReposity = AppDataSource.getRepository(Address);

export class UserController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userid;
      const user = await userRepository.findOne({ where: { id: userId } });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      await userRepository.update(userId, req.body);
      res.json({ success: true, message: "Profile updated" });
    } catch (error) {
      next(error);
    }
  }

  async getAddresses(req, res, next) {
    try {
      const userId = req.user.userId;
      const addresses = await addressReposity.find({ where: { userId } });
      res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req, res, next) {
    try {
      const userId = req.user.userId;
      const address = addressReposity.create({ ...req.body, userId });
      await addressReposity.save(address);
      res.status(201).json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  }
}
