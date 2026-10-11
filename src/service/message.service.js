import * as messageDAO from "../dao/message.dao.js";
import * as aiService from "./ai.service.js";
import Ticket from "../models/ticket.model.js";
import AppError from "../utils/appError.js";

/**
 * Add a message to an existing ticket
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {string} messageContent - The message content
 * @param {string} sender - Who is sending ('customer', 'agent', 'ai')
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - Created message object
 */
export const addMessageToTicket = async (
  ticketId,
  messageContent,
  sender,
  userId,
  tenantId
) => {
  try {
    const ticket = await Ticket.findOne({ _id: ticketId, tenantId });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    if (ticket.status === "resolved") {
      throw new AppError("This ticket has been resolved. Please start a new chat.", 400);
    }

    const message = await messageDAO.createMessage({
      ticketId,
      sender,
      message: messageContent,
    });

    // Provide AI processing only if sender is customer and ticket is NOT connected to an agent
    let aiReply = null;
    const isAssignedToAgent = Boolean(ticket.assignedTo || ticket.status === "assigned");
    if (sender === "customer" && !isAssignedToAgent) {
      aiReply = await aiService.processFollowUpMessage(ticket, messageContent, tenantId);
    }

    return {
      message,
      aiReply,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error in addMessageToTicket:", error);
    throw new AppError("Failed to add message", 500);
  }
};

/**
 * Add an agent reply to a ticket
 * Validates that the agent is assigned to the ticket (or is admin)
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {string} content - Message content
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @param {string} userRole - 'agent' or 'admin'
 * @returns {Promise<Object>} - Created message object
 */
export const addAgentReply = async (
  ticketId,
  agentId,
  content,
  tenantId,
  userRole
) => {
  try {
    const ticket = await Ticket.findOne({ _id: ticketId, tenantId });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Agents can only reply to tickets assigned to them; admins bypass
    if (userRole === "agent") {
      if (String(ticket.assignedTo) !== String(agentId)) {
        throw new AppError("You can only reply to tickets assigned to you", 403);
      }
    }

    // Prevent replies to resolved tickets
    if (ticket.status === "resolved") {
      throw new AppError("Cannot reply to a resolved ticket. Please reopen it first.", 400);
    }

    const message = await messageDAO.createMessage({
      ticketId,
      sender: "agent",
      message: content,
    });

    // If ticket is still 'open', mark it as 'assigned' on first agent reply
    if (ticket.status === "open") {
      await Ticket.findByIdAndUpdate(ticketId, {
        status: "assigned",
        assignedTo: agentId,
      });
    }

    return message;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error in addAgentReply:", error);
    throw new AppError("Failed to add agent reply", 500);
  }
};

/**
 * Get all messages for a specific ticket (for agent workspace)
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Array>} - Messages sorted oldest first
 */
export const getConversationForAgent = async (ticketId, tenantId) => {
  try {
    const ticket = await Ticket.findOne({ _id: ticketId, tenantId });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    const messages = await messageDAO.getConversationHistory(ticketId, 100);
    return messages;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error in getConversationForAgent:", error);
    throw new AppError("Failed to fetch messages", 500);
  }
};

/**
 * Get all messages for a specific ticket
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {number} page - Page number
 * @param {number} limit - Messages per page
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - Messages and pagination info
 */
export const getTicketMessages = async (
  ticketId,
  page = 1,
  limit = 50,
  tenantId
) => {
  try {
    const ticket = await Ticket.findOne({ _id: ticketId, tenantId });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    const result = await messageDAO.getMessagesByTicketId(ticketId, page, limit);
    return {
      ...result,
      status: ticket.status,
      ticket: {
        _id: ticket._id,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error in getTicketMessages:", error);
    throw new AppError("Failed to fetch messages", 500);
  }
};

/**
 * Generate an AI reply suggestion for an agent
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {string} agentId - MongoDB ObjectId of the agent
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @param {string} userRole - 'agent' or 'admin'
 * @returns {Promise<string>} - AI-suggested reply text
 */
export const getAISuggestion = async (ticketId, agentId, tenantId, userRole) => {
  try {
    const ticket = await Ticket.findOne({ _id: ticketId, tenantId });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Agents can only get suggestions for their assigned tickets
    if (userRole === "agent") {
      if (String(ticket.assignedTo) !== String(agentId)) {
        throw new AppError("You can only get suggestions for tickets assigned to you", 403);
      }
    }

    const suggestion = await aiService.generateAgentReplySuggestion(ticketId, tenantId);
    return suggestion;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error in getAISuggestion:", error);
    throw new AppError("Failed to generate AI suggestion", 500);
  }
};
