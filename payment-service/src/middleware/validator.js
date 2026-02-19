import { ApiError } from "../utils/ApiError";

export const validate = (schema) => {
  return (req, res) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      throw new ApiError(400, "Validation failed", errors);
    }
    next();
  };
};
