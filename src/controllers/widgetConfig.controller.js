import * as chatWidgetDAO from "../dao/chatWidget.dao.js";
import AppError from "../utils/appError.js";

/**
 * @route GET /api/public/widget-config
 * @desc Get widget configuration by API key
 * @access Public
 */
export const getWidgetConfig = async (req, res) => {
  try {
    const { apiKey } = req.query;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "API Key is required in query parameter",
      });
    }

    const config = await chatWidgetDAO.getWidgetConfig(apiKey);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Widget not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getWidgetConfig:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching widget configuration",
    });
  }
};

/**
 * @route GET /api/public/widget/:apiKey/config
 * @desc Get widget configuration by API key (path parameter)
 * @access Public
 */
export const getWidgetConfigByKey = async (req, res) => {
  try {
    const { apiKey } = req.params;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "API Key is required",
      });
    }

    const config = await chatWidgetDAO.getWidgetConfig(apiKey);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Widget not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getWidgetConfigByKey:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching widget configuration",
    });
  }
};
