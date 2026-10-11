import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { upload } from "../config/multer.js";
import {
  authMiddleware,
  isAdmin,
  tenantMiddleware,
} from "../middleware/auth.middleware.js";

import {
  approveUserValidation,
  updateRoleValidation,
} from "../validation/admin.validation.js";

const router = express.Router();

// Apply auth + admin check globally
router.use(authMiddleware);

/**
 * @route GET /api/admin/users
 */
router.get("/users",isAdmin, tenantMiddleware, adminController.getUsers);

/**
 * @route PATCH /api/admin/users/:userId/approve
 */
router.patch(
  "/users/:userId/approve",
  isAdmin,
  approveUserValidation,
  tenantMiddleware,
  adminController.approveUser
);

/**
 * @route PATCH /api/admin/users/:userId/suspend
 * @desc Suspend an agent (set isApproved=false, isOnline=false)
 */
router.patch(
  "/users/:userId/suspend",
  isAdmin,
  tenantMiddleware,
  adminController.suspendUser
);

/**
 * @route PATCH /api/admin/users/:userId/role
 */
router.patch(
  "/users/:userId/role",
  isAdmin,
  updateRoleValidation,
  tenantMiddleware,
  adminController.updateUserRole
);

/**
 * @route GET /api/admin/stats
 */
router.get("/stats", tenantMiddleware, adminController.getStats);

/**
 * @route POST /api/admin/tenant/context
 * @desc add tenant context for ai assistant
 */
router.post("/tenant/context", isAdmin, tenantMiddleware, upload.single("file"), adminController.addTenantContext);

/**
 * @route PUT /api/admin/integrations
 * @desc update tenant integrations
 */
router.put("/integrations", isAdmin, tenantMiddleware, adminController.updateIntegrations);

export default router;