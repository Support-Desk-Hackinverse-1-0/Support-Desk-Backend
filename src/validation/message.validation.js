import { body } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

export const sendMessageValidation = [
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message must be between 1 and 5000 characters"),

  body("customerEmail")
    .isEmail()
    .withMessage("Valid customer email required"),

  validateRequest,
];

export const getMessagesValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),

  body("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be >= 1"),

  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  validateRequest,
];
