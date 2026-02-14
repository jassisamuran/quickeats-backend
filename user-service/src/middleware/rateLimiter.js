import rateLimit from "express-rate-limit";

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: "Too many requests from this IP, Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
};
