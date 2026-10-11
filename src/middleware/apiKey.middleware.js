import ApiKey from "../models/apiKey.model.js";
import ChatWidget from "../models/chatWidget.model.js";
import AppError from "../utils/appError.js";

/**
 * API Key Validation Middleware
 * 
 * Validates API key from request and extracts tenant info
 * Supports: Header (X-API-Key) or Body (apiKey)
 */
export const apiKeyMiddleware = async (req, res, next) => {
  try {
    // Get API key from header or body
    const apiKey = req.headers["x-api-key"] || req.body?.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API Key is required (use X-API-Key header or apiKey in body)",
      });
    }

    // Find and validate API key
    const keyRecord = await ApiKey.findOne({ key: apiKey, isActive: true })
      .select("+key")
      .populate("tenantId", "_id")
      .populate("chatWidgetId");

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive API Key",
      });
    }

    // Check if key is expired
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return res.status(401).json({
        success: false,
        message: "API Key has expired",
      });
    }

    // Check rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const requestsToday = await ApiKey.countDocuments({
      _id: keyRecord._id,
      createdAt: { $gte: today },
    });

    if (requestsToday >= keyRecord.rateLimit) {
      return res.status(429).json({
        success: false,
        message: "API Key rate limit exceeded",
      });
    }

    // Check domain whitelist
    const origin = req.headers.origin || req.headers.referer;
    if (keyRecord.chatWidgetId?.allowedDomains?.length > 0 && origin) {
      const domainAllowed = keyRecord.chatWidgetId.allowedDomains.some(
        (domain) => origin.includes(domain)
      );

      if (!domainAllowed) {
        return res.status(403).json({
          success: false,
          message: "Origin not whitelisted for this API Key",
        });
      }
    }

    // Update last used timestamp
    await ApiKey.findByIdAndUpdate(keyRecord._id, {
      lastUsed: new Date(),
      $inc: { requestCount: 1 },
    });

    // Attach to request
    req.apiKey = keyRecord;
    req.tenantId = keyRecord.tenantId._id;
    req.chatWidgetId = keyRecord.chatWidgetId._id;
    req.user = {
      tenantId: keyRecord.tenantId._id,
      id: null, // No specific user for public widget
      role: "customer", // Public customer
    };

    next();
  } catch (error) {
    console.error("Error in apiKeyMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating API Key",
    });
  }
};

/**
 * Optional: Admin API Key Middleware
 * For admin-only endpoints that still require API Key
 */
export const optionalApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.body?.apiKey;

    if (apiKey) {
      const keyRecord = await ApiKey.findOne({ key: apiKey, isActive: true })
        .select("+key")
        .populate("tenantId");

      if (keyRecord && (!keyRecord.expiresAt || new Date() <= keyRecord.expiresAt)) {
        req.apiKey = keyRecord;
        req.tenantId = keyRecord.tenantId._id;
      }
    }

    next();
  } catch (error) {
    console.error("Error in optionalApiKey:", error);
    next();
  }
};
