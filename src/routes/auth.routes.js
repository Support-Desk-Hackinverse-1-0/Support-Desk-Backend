import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { tenantOnboardingValidation, registerValidation , loginValidation, updatePasswordValidation } from "../validation/auth.validation.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();

/**
 * @route /api/widgets
/api/auth
 * @desc Register a new tenant along with an admin user
 * @access Public
 * @body { name, slug, supportEmail, adminName, adminEmail, password }
 * @returns {Object} - The created tenant and admin user details
 */
router.post("/tenant/register", tenantOnboardingValidation, authController.registerTenant);

/**
 * @route POST /api/auth/register
 * @desc Register a new user under an existing tenant
 * @access Public
 * @body { name, email, password, tenantId }
 * @returns {Object} - The created user details and jwt token
 */
router.post("/register", registerValidation, authController.registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login a user and return a JWT token
 * @access Public
 * @body { email, password }
 * @returns {Object} - The logged in user details and JWT token
 */
router.post("/login", loginValidation, authController.loginUser);

router.post("/logout", authMiddleware, authController.logoutUser);

/**
 * @route GET /api/auth/tenant
 * @desc Get current tenant details by slug
 * @access Public
 * @query { slug }
 * @returns {Object} - The tenant details if found
 */
router.get("/tenant", authController.getCurrentTenant);

/**
 * @route GET /api/auth/me
 * @desc Get current logged in user details
 * @access Private
 * @returns {Object} - The current logged in user details
 */
router.get("/me", authMiddleware, authController.getMe);


export default router;

router.patch(
    "/update-password",
    authMiddleware,
    updatePasswordValidation,
    authController.updatePassword
  );