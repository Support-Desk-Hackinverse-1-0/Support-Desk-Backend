import { body } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

export const createWidgetValidation = [
  body("name")
    .notEmpty()
    .withMessage("Widget name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("primaryColor")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Primary color must be a valid hex color"),

  body("secondaryColor")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Secondary color must be a valid hex color"),

  body("textColor")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Text color must be a valid hex color"),

  body("backgroundColor")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Background color must be a valid hex color"),

  body("borderRadius")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Border radius must be between 0 and 50"),

  body("position")
    .optional()
    .isIn(["bottom-right", "bottom-left", "top-right", "top-left"])
    .withMessage("Position must be one of: bottom-right, bottom-left, top-right, top-left"),

  body("width")
    .optional()
    .isInt({ min: 200, max: 600 })
    .withMessage("Width must be between 200 and 600"),

  body("height")
    .optional()
    .isInt({ min: 300, max: 800 })
    .withMessage("Height must be between 300 and 800"),

  body("title")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Title cannot exceed 50 characters"),

  body("subtitle")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Subtitle cannot exceed 100 characters"),

  body("welcomeMessage")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Welcome message cannot exceed 300 characters"),


  validateRequest,
];

export const updateWidgetValidation = [
  ...createWidgetValidation,
];

export const createApiKeyValidation = [
  body("name")
    .notEmpty()
    .withMessage("Key name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("rateLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Rate limit must be >= 1"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("expiration date must be a valid date"),

  validateRequest,
];
