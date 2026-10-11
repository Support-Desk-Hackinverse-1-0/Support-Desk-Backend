import ChatWidget from "../models/chatWidget.model.js";
import ApiKey from "../models/apiKey.model.js";
import crypto from "crypto";

/**
 * Generate unique API Key
 */
const generateApiKey = () => {
  return `sk_${crypto.randomBytes(24).toString("hex")}`;
};

/**
 * Create a new Chat Widget
 */
export const createChatWidget = async (data, tenantId) => {
  const apiKey = generateApiKey();

  const widget = await ChatWidget.create({
    tenantId,
    name: data.name,
    description: data.description,
    primaryColor: data.primaryColor || "#007bff",
    secondaryColor: data.secondaryColor || "#6c757d",
    textColor: data.textColor || "#212529",
    backgroundColor: data.backgroundColor || "#ffffff",
    borderRadius: data.borderRadius || 8,
    position: data.position || "bottom-right",
    width: data.width || 350,
    height: data.height || 500,
    title: data.title || "Chat with us",
    subtitle: data.subtitle || "We are here to help",
    welcomeMessage: data.welcomeMessage || "Hello! How can we help you today?",
    showAvatar: data.showAvatar !== false,
    showTimestamps: data.showTimestamps !== false,
    apiKey,
    isActive: true,
    allowedDomains: data.allowedDomains || [],
  });

  // Create corresponding API Key record
  await ApiKey.create({
    tenantId,
    chatWidgetId: widget._id,
    key: apiKey,
    name: `${data.name} API Key`,
    description: `Auto-generated for ${data.name}`,
    isActive: true,
  });

  return widget;
};

/**
 * Get Chat Widget by ID
 */
export const getChatWidgetById = async (widgetId, tenantId) => {
  const widget = await ChatWidget.findOne({
    _id: widgetId,
    tenantId,
  });

  return widget;
};

/**
 * Get all Chat Widgets for tenant
 */
export const getChatWidgetsByTenant = async (
  tenantId,
  page = 1,
  limit = 10,
) => {
  const skip = (page - 1) * limit;

  const widgets = await ChatWidget.find({ tenantId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ChatWidget.countDocuments({ tenantId });

  return {
    widgets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update Chat Widget
 */
export const updateChatWidget = async (widgetId, tenantId, data) => {
  const widget = await ChatWidget.findOneAndUpdate(
    { _id: widgetId, tenantId },
    {
      name: data.name,
      description: data.description,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      textColor: data.textColor,
      backgroundColor: data.backgroundColor,
      borderRadius: data.borderRadius,
      position: data.position,
      width: data.width,
      height: data.height,
      title: data.title,
      subtitle: data.subtitle,
      welcomeMessage: data.welcomeMessage,
      showAvatar: data.showAvatar,
      showTimestamps: data.showTimestamps,
      allowedDomains: data.allowedDomains,
      isActive: data.isActive,
    },
    { returnDocument: "after" },
  );

  return widget;
};

/**
 * Delete Chat Widget
 */
export const deleteChatWidget = async (widgetId, tenantId) => {
  const widget = await ChatWidget.findOneAndDelete({
    _id: widgetId,
    tenantId,
  });

  // Also delete associated API keys
  if (widget) {
    await ApiKey.deleteMany({ chatWidgetId: widgetId });
  }

  return widget;
};

/**
 * Get Widget Configuration (for public use - no sensitive data)
 */
export const getWidgetConfig = async (apiKey) => {
  const keyRecord = await ApiKey.findOne({
    key: apiKey,
    isActive: true,
  }).populate("chatWidgetId");

  if (!keyRecord || !keyRecord.chatWidgetId?.isActive) {
    return null;
  }

  const widget = keyRecord.chatWidgetId;

  return {
    id: widget._id,
    name: widget.name,
    title: widget.title,
    subtitle: widget.subtitle,
    welcomeMessage: widget.welcomeMessage,
    primaryColor: widget.primaryColor,
    secondaryColor: widget.secondaryColor,
    textColor: widget.textColor,
    backgroundColor: widget.backgroundColor,
    borderRadius: widget.borderRadius,
    position: widget.position,
    width: widget.width,
    height: widget.height,
    showAvatar: widget.showAvatar,
    showTimestamps: widget.showTimestamps,
  };
};

/**
 * Regenerate API Key for widget
 */
export const regenerateApiKey = async (widgetId, tenantId) => {
  const widget = await ChatWidget.findOne({
    _id: widgetId,
    tenantId,
  });

  if (!widget) {
    return null;
  }

  // Deactivate old key
  await ApiKey.findOneAndUpdate(
    { chatWidgetId: widgetId, isActive: true },
    { isActive: false },
  );

  // Generate new key
  const newApiKey = generateApiKey();

  // Update widget with new key
  widget.apiKey = newApiKey;
  await widget.save();

  // Create new API Key record
  await ApiKey.create({
    tenantId,
    chatWidgetId: widgetId,
    key: newApiKey,
    name: `${widget.name} API Key (Regenerated)`,
    isActive: true,
  });

  return widget;
};

/**
 * Get Widget API Key (for admin - with mask for security)
 */
export const getWidgetApiKey = async (widgetId, tenantId, showFull = false) => {
  const widget = await ChatWidget.findOne({
    _id: widgetId,
    tenantId,
  }).select("+apiKey");

  if (!widget) {
    return null;
  }

  if (showFull) {
    return widget.apiKey;
  }

  // Mask key for security
  const key = widget.apiKey;
  const masked = key.substring(0, 5) + "..." + key.substring(key.length - 5);

  return masked;
};
