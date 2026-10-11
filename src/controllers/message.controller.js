import * as aiService from "../service/ai.service.js";
import * as messageService from "../service/message.service.js";
import * as chatWidgetDAO from "../dao/chatWidget.dao.js";
import * as ticketDAO from "../dao/ticket.dao.js";
import AppError from "../utils/appError.js";

/**
 * @route POST /api/messages/send
 * @desc Send a message and get AI response or ticket creation
 * @access Public/Customer (requires API Key)
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, customerEmail } = req.body;
    const { tenantId } = req.user;

    if (!message || !customerEmail || !tenantId) {
      return res.status(400).json({
        success: false,
        message: "Message, customer email, and tenant ID are required",
      });
    }

    const result = await aiService.processCustomerMessage(message, customerEmail, tenantId);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in sendMessage:", err);
    return res.status(500).json({ success: false, message: "Error processing message" });
  }
};

/**
 * @route POST /api/messages/ticket/:ticketId
 * @desc Add a message to an existing ticket (customer via widget)
 * @access Public (requires API Key)
 */
export const addMessageToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const { tenantId, role, id: userId } = req.user;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const result = await messageService.addMessageToTicket(
      ticketId,
      message,
      role === "agent" ? "agent" : "customer",
      userId,
      tenantId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Message added successfully",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in addMessageToTicket:", err);
    return res.status(500).json({ success: false, message: "Error adding message" });
  }
};

/**
 * @route POST /api/messages/agent/reply/:ticketId
 * @desc Agent sends a reply to a ticket conversation
 * @access Private (agent/admin — JWT auth)
 */
export const agentReplyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const { tenantId, role, id: agentId } = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const result = await messageService.addAgentReply(
      ticketId,
      agentId,
      message.trim(),
      tenantId,
      role
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Reply sent successfully",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in agentReplyToTicket:", err);
    return res.status(500).json({ success: false, message: "Error sending reply" });
  }
};

/**
 * @route GET /api/messages/agent/:ticketId
 * @desc Get full conversation thread for agent workspace
 * @access Private (agent/admin — JWT auth)
 */
export const getAgentTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tenantId } = req.user;

    const messages = await messageService.getConversationForAgent(ticketId, tenantId);

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getAgentTicketMessages:", err);
    return res.status(500).json({ success: false, message: "Error fetching messages" });
  }
};

/**
 * @route POST /api/messages/agent/ai-suggest/:ticketId
 * @desc Generate an AI reply suggestion for the agent
 * @access Private (agent/admin — JWT auth)
 */
export const getAISuggestion = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tenantId, role, id: agentId } = req.user;

    const suggestion = await messageService.getAISuggestion(
      ticketId,
      agentId,
      tenantId,
      role
    );

    return res.status(200).json({
      success: true,
      data: { suggestion },
      message: "AI suggestion generated",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getAISuggestion:", err);
    return res.status(500).json({ success: false, message: "Error generating suggestion" });
  }
};

/**
 * @route GET /api/messages/:ticketId
 * @desc Get all messages for a ticket (customer widget)
 * @access Public (requires API Key)
 */
export const getTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { tenantId } = req.user;

    const result = await messageService.getTicketMessages(
      ticketId,
      parseInt(page),
      parseInt(limit),
      tenantId
    );

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getTicketMessages:", err);
    return res.status(500).json({ success: false, message: "Error fetching messages" });
  }
};

/**
 * @route GET /api/messages/customer/tickets
 * @desc Get all tickets for a customer email
 * @access Public (requires API Key)
 */
export const getCustomerTickets = async (req, res) => {
  try {
    const { email } = req.query;
    const { tenantId } = req.user;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const filter = { tenantId, customerEmail: email };
    // Fetch top 50 tickets for this customer
    const result = await ticketDAO.getTickets(filter, 1, 50);

    return res.status(200).json({ success: true, data: result.tickets });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getCustomerTickets:", err);
    return res.status(500).json({ success: false, message: "Error fetching customer tickets" });
  }
};

/**
 * @route POST /api/messages/kb-query
 * @desc Query knowledge base directly
 * @access Public (requires API Key)
 */
export const queryKnowledgeBase = async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const results = await aiService.queryVectorDB(query, topK);

    return res.status(200).json({
      success: true,
      data: results,
      message: "Knowledge base query completed",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in queryKnowledgeBase:", err);
    return res.status(500).json({ success: false, message: "Error querying knowledge base" });
  }
};

/**
 * @route GET /api/messages/widget-config
 * @desc Get the visual configuration for the widget (using API key)
 * @access Public (requires API Key)
 */
export const getWidgetConfig = async (req, res) => {
  try {
    const { chatWidgetId, tenantId } = req;

    if (!chatWidgetId) {
      return res.status(400).json({ success: false, message: "Widget ID not found in token" });
    }

    const widget = await chatWidgetDAO.getChatWidgetById(chatWidgetId, tenantId);

    if (!widget) {
      return res.status(404).json({ success: false, message: "Widget not found" });
    }

    return res.status(200).json({
      success: true,
      data: widget,
    });
  } catch (err) {
    console.error("Error in getWidgetConfig:", err);
    return res.status(500).json({ success: false, message: "Error fetching widget config" });
  }
};
