import { validationResult } from "express-validator";

/**
 * Middleware to handle validation errors
 *
 * @description
 * - Checks validation result from express-validator
 * - If errors exist → return 400 response
 * - Else → move to next middleware/controller
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  // If validation errors exist
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // return first error
    });
  }

  next();
};

export default validateRequest;