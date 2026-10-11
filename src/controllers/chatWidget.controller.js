import * as chatWidgetDAO from "../dao/chatWidget.dao.js";
import * as apiKeyDAO from "../dao/apiKey.dao.js";
import AppError from "../utils/appError.js";

/**
 * @route POST /api/admin/widgets
 * @desc Create a new chat widget
 * @access Admin only
 */
export const createChatWidget = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const data = req.body;

    const widget = await chatWidgetDAO.createChatWidget(data, tenantId);

    return res.status(201).json({
      success: true,
      message: "Chat widget created successfully",
      data: {
        id: widget._id,
        name: widget.name,
        apiKey: widget.apiKey,
        ...widget.toObject(),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in createChatWidget:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating chat widget",
    });
  }
};

/**
 * @route GET /api/admin/widgets
 * @desc Get all chat widgets for tenant
 * @access Admin only
 */
export const getChatWidgets = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const result = await chatWidgetDAO.getChatWidgetsByTenant(
      tenantId,
      parseInt(page),
      parseInt(limit)
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getChatWidgets:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching chat widgets",
    });
  }
};

/**
 * @route GET /api/admin/widgets/:widgetId
 * @desc Get specific chat widget
 * @access Admin only
 */
export const getChatWidget = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;

    const widget = await chatWidgetDAO.getChatWidgetById(widgetId, tenantId);

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: widget,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getChatWidget:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching chat widget",
    });
  }
};

/**
 * @route PUT /api/admin/widgets/:widgetId
 * @desc Update chat widget
 * @access Admin only
 */
export const updateChatWidget = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;
    const data = req.body;

    const widget = await chatWidgetDAO.updateChatWidget(widgetId, tenantId, data);

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat widget updated successfully",
      data: widget,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in updateChatWidget:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating chat widget",
    });
  }
};

/**
 * @route DELETE /api/admin/widgets/:widgetId
 * @desc Delete chat widget
 * @access Admin only
 */
export const deleteChatWidget = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;

    const widget = await chatWidgetDAO.deleteChatWidget(widgetId, tenantId);

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat widget deleted successfully",
      data: widget,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in deleteChatWidget:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting chat widget",
    });
  }
};

/**
 * @route POST /api/admin/widgets/:widgetId/regenerate-key
 * @desc Regenerate API key for widget
 * @access Admin only
 */
export const regenerateApiKey = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;

    const widget = await chatWidgetDAO.regenerateApiKey(widgetId, tenantId);

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "API key regenerated successfully",
      data: {
        widgetId: widget._id,
        apiKey: widget.apiKey,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in regenerateApiKey:", err);
    return res.status(500).json({
      success: false,
      message: "Error regenerating API key",
    });
  }
};

/**
 * @route GET /api/admin/widgets/:widgetId/api-keys
 * @desc Get API keys for widget
 * @access Admin only
 */
export const getApiKeys = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;

    // Verify widget exists
    const widget = await chatWidgetDAO.getChatWidgetById(widgetId, tenantId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    const apiKeys = await apiKeyDAO.getApiKeysByWidget(widgetId, tenantId);

    return res.status(200).json({
      success: true,
      data: apiKeys,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getApiKeys:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching API keys",
    });
  }
};

/**
 * @route POST /api/admin/widgets/:widgetId/api-keys
 * @desc Create additional API key for widget
 * @access Admin only
 */
export const createApiKey = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { widgetId } = req.params;
    const { name, description, rateLimit, expiresAt } = req.body;

    // Verify widget exists
    const widget = await chatWidgetDAO.getChatWidgetById(widgetId, tenantId);
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Chat widget not found",
      });
    }

    const apiKey = await apiKeyDAO.createApiKey(widgetId, tenantId, {
      name,
      description,
      rateLimit,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key,
        ...apiKey.toObject(),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in createApiKey:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating API key",
    });
  }
};

/**
 * @route DELETE /api/admin/api-keys/:keyId
 * @desc Delete API key
 * @access Admin only
 */
export const deleteApiKey = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { keyId } = req.params;

    const apiKey = await apiKeyDAO.deleteApiKey(keyId, tenantId);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in deleteApiKey:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting API key",
    });
  }
};

/**
 * @route GET /api/admin/api-keys/:keyId/stats
 * @desc Get API key usage statistics
 * @access Admin only
 */
export const getApiKeyStats = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { keyId } = req.params;

    const stats = await apiKeyDAO.getApiKeyStats(keyId, tenantId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getApiKeyStats:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching API key stats",
    });
  }
};
