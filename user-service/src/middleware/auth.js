import { jwtService } from "../services/jwtService";
import { ApiError } from "../utils/ApiError";

const jwtService = new jwtService();

export const authenticate = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }
    const token = authHeader.substring(7);
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
