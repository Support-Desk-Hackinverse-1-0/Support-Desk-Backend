import { body, param } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

export const approveUserValidation = [
  param("userId").isMongoId().withMessage("Invalid user ID"),

  body("isApproved")
    .isBoolean()
    .withMessage("isApproved must be true or false"),

  validateRequest,
];

export const updateRoleValidation = [
  param("userId").isMongoId().withMessage("Invalid user ID"),

  body("role")
    .isIn(["admin", "agent"])
    .withMessage("Role must be admin or agent"),

  validateRequest,
];
