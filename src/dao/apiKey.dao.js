import ApiKey from "../models/apiKey.model.js";
import crypto from "crypto";

/**
 * Get API Key by key string
 */
export const getApiKeyByKey = async (key) => {
  const apiKey = await ApiKey.findOne({ key, isActive: true })
    .select("+key")
    .populate("chatWidgetId")
    .populate("tenantId");

  return apiKey;
};

/**
 * Get API Keys for a Chat Widget
 */
export const getApiKeysByWidget = async (chatWidgetId, tenantId) => {
  const apiKeys = await ApiKey.find({
    chatWidgetId,
    tenantId,
  })
    .select("+key") // Include full key for UI
    .sort({ createdAt: -1 });

  return apiKeys;
};

/**
 * Create new API Key for widget
 */
export const createApiKey = async (chatWidgetId, tenantId, data) => {
  const key = `sk_${crypto.randomBytes(24).toString("hex")}`;

  const apiKey = await ApiKey.create({
    tenantId,
    chatWidgetId,
    key,
    name: data.name,
    description: data.description,
    isActive: true,
    expiresAt: data.expiresAt || null,
    rateLimit: data.rateLimit || 1000,
  });

  return apiKey;
};

/**
 * Update API Key
 */
export const updateApiKey = async (apiKeyId, tenantId, data) => {
  const apiKey = await ApiKey.findOneAndUpdate(
    {
      _id: apiKeyId,
      tenantId,
    },
    {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      expiresAt: data.expiresAt,
      rateLimit: data.rateLimit,
    },
    { new: true }
  );

  return apiKey;
};

/**
 * Deactivate API Key
 */
export const deactivateApiKey = async (apiKeyId, tenantId) => {
  const apiKey = await ApiKey.findOneAndUpdate(
    { _id: apiKeyId, tenantId },
    { isActive: false },
    { new: true }
  );

  return apiKey;
};

/**
 * Delete API Key
 */
export const deleteApiKey = async (apiKeyId, tenantId) => {
  const apiKey = await ApiKey.findOneAndDelete({
    _id: apiKeyId,
    tenantId,
  });

  return apiKey;
};

/**
 * Get API Key usage stats
 */
export const getApiKeyStats = async (apiKeyId, tenantId) => {
  const apiKey = await ApiKey.findOne({
    _id: apiKeyId,
    tenantId,
  });

  if (!apiKey) {
    return null;
  }

  return {
    id: apiKey._id,
    name: apiKey.name,
    requestCount: apiKey.requestCount,
    lastUsed: apiKey.lastUsed,
    rateLimit: apiKey.rateLimit,
    isActive: apiKey.isActive,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
};

/**
 * Check if API key exists and is valid
 */
export const validateApiKey = async (key, tenantId) => {
  const apiKey = await ApiKey.findOne({
    key,
    tenantId,
    isActive: true,
  })
    .select("+key")
    .populate("chatWidgetId");

  if (!apiKey) {
    return false;
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return false;
  }

  return true;
};
