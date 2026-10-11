import { body } from "express-validator";
import { query } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

export const createTicketValidation = [
  body("customerEmail")
    .isEmail()
    .withMessage("Valid email required"),

  body("subject")
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ max: 200 }),

  validateRequest,
];

export const getTicketsValidation = [
  query("status")
    .optional()
    .isIn(["open", "assigned", "resolved"])
    .withMessage("Invalid status"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be >= 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1-100"),

  validateRequest,
];