import express from "express";
import * as widgetConfigController from "../controllers/widgetConfig.controller.js";

const router = express.Router();

/**
 * PUBLIC ROUTES - No authentication required
 */

/**
 * @route GET /api/public/widget-config
 * @desc Get widget configuration by API key (for embedding in website)
 * @access Public
 * @query {string} apiKey - Chat widget API key
 */
router.get("/widget-config", widgetConfigController.getWidgetConfig);

/**
 * @route GET /api/public/widget/:apiKey/config
 * @desc Alternative endpoint to get widget configuration
 * @access Public
 * @params {string} apiKey - Chat widget API key
 */
router.get("/widget/:apiKey/config", widgetConfigController.getWidgetConfigByKey);

export default router;
