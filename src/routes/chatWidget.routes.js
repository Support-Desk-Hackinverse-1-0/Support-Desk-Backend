import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminRoleCheck } from "../middleware/roleCheck.middleware.js";
import * as widgetController from "../controllers/chatWidget.controller.js";
import { createWidgetValidation, updateWidgetValidation } from "../validation/chatWidget.validation.js";

const router = express.Router();

/**
 * ADMIN ONLY - Chat Widget Management Routes
 * All routes require authentication and admin role
 */

/**
 * @route POST /api/admin/widgets
 * @desc Create a new chat widget
 * @access Admin only
 * @body {string} name - Widget name
 * @body {string} description - Widget description
 * @body {string} primaryColor - Primary color (hex)
 * @body {string} title - Widget title
 */
router.post(
  "/",
  authMiddleware,
  adminRoleCheck,
  createWidgetValidation,
  widgetController.createChatWidget
);

/**
 * @route GET /api/admin/widgets
 * @desc Get all chat widgets for tenant
 * @access Admin only
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 */
router.get(
  "/",
  authMiddleware,
  adminRoleCheck,
  widgetController.getChatWidgets
);

/**
 * @route GET /api/admin/widgets/:widgetId
 * @desc Get specific chat widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 */
router.get(
  "/:widgetId",
  authMiddleware,
  adminRoleCheck,
  widgetController.getChatWidget
);

/**
 * @route PUT /api/admin/widgets/:widgetId
 * @desc Update chat widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 * @body {object} - Widget configuration
 */
router.put(
  "/:widgetId",
  authMiddleware,
  adminRoleCheck,
  updateWidgetValidation,
  widgetController.updateChatWidget
);

/**
 * @route DELETE /api/admin/widgets/:widgetId
 * @desc Delete chat widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 */
router.delete(
  "/:widgetId",
  authMiddleware,
  adminRoleCheck,
  widgetController.deleteChatWidget
);

/**
 * @route POST /api/admin/widgets/:widgetId/regenerate-key
 * @desc Regenerate API key for widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 */
router.post(
  "/:widgetId/regenerate-key",
  authMiddleware,
  adminRoleCheck,
  widgetController.regenerateApiKey
);

/**
 * @route GET /api/admin/widgets/:widgetId/api-keys
 * @desc Get API keys for widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 */
router.get(
  "/:widgetId/api-keys",
  authMiddleware,
  adminRoleCheck,
  widgetController.getApiKeys
);

/**
 * @route POST /api/admin/widgets/:widgetId/api-keys
 * @desc Create additional API key for widget
 * @access Admin only
 * @params {string} widgetId - Widget ID
 * @body {string} name - Key name
 * @body {string} description - Key description
 */
router.post(
  "/:widgetId/api-keys",
  authMiddleware,
  adminRoleCheck,
  widgetController.createApiKey
);

/**
 * @route DELETE /api/admin/api-keys/:keyId
 * @desc Delete API key
 * @access Admin only
 * @params {string} keyId - API Key ID
 */
router.delete(
  "/api-keys/:keyId",
  authMiddleware,
  adminRoleCheck,
  widgetController.deleteApiKey
);

/**
 * @route GET /api/admin/api-keys/:keyId/stats
 * @desc Get API key usage statistics
 * @access Admin only
 * @params {string} keyId - API Key ID
 */
router.get(
  "/api-keys/:keyId/stats",
  authMiddleware,
  adminRoleCheck,
  widgetController.getApiKeyStats
);

export default router;
