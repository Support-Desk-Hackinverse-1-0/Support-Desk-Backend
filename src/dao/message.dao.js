import Message from "../models/message.model.js";
import Ticket from "../models/ticket.model.js";
import User from "../models/user.model.js";

/**
 * Create a new message
 *
 * @param {Object} data - Message data {ticketId, sender, message}
 * @returns {Promise<Object>} - Created message object
 *
 * @description
 * - Creates a new message associated with a ticket
 * - sender can be 'customer', 'agent', or 'ai'
 */
export const createMessage = async (data) => {
  const message = await Message.create({
    ticketId: data.ticketId,
    sender: data.sender,
    message: data.message,
  });

  return message;
};

/**
 * Get messages for a ticket
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Number of records per page
 * @returns {Promise<Object>} - {messages, total, page, totalPages}
 *
 * @description
 * - Retrieves messages for a specific ticket
 * - Sorted by createdAt in ascending order (oldest first)
 */
export const getMessagesByTicketId = async (ticketId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const messages = await Message.find({ ticketId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: 1 });

  const total = await Message.countDocuments({ ticketId });

  return {
    messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get agent with least assigned tickets in a tenant
 *
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - User object of the agent with least tickets, or null if no agents available
 *
 * @description
 * - Finds all agents in the tenant
 * - Counts assigned tickets for each agent
 * - Returns the agent with the least tickets
 * - Only returns approved agents
 */
export const getAvailableAgent = async (tenantId) => {
  try {
    // Get all approved agents for the tenant
    // Get all approved agents/admins for the tenant
    const agents = await User.find({
      tenantId,
      role: { $in: ["agent", "admin"] },
      isApproved: true,
    }).lean();

    if (agents.length === 0) {
      return null;
    }

    // Count tickets assigned to each agent
    const agentWithTicketCounts = await Promise.all(
      agents.map(async (agent) => {
        const ticketCount = await Ticket.countDocuments({
          assignedTo: agent._id,
          status: { $in: ["open", "assigned"] },
        });
        return {
          ...agent,
          ticketCount,
        };
      })
    );

    // Filter out agents with 5 or more tickets
    const availableAgents = agentWithTicketCounts.filter(a => a.ticketCount < 5);

    if (availableAgents.length === 0) {
      return null;
    }

    // Sort by ticket count and get the one with least tickets
    availableAgents.sort((a, b) => a.ticketCount - b.ticketCount);

    return availableAgents[0];
  } catch (error) {
    console.error("Error in getAvailableAgent:", error);
    throw error;
  }
};

/**
 * Update ticket with assignment and status
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {Object} updateData - Data to update {assignedTo, status}
 * @returns {Promise<Object>} - Updated ticket object
 */
export const updateTicket = async (ticketId, updateData) => {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { ...updateData, updatedAt: Date.now() },
    { returnDocument: "after" }
  );
  console.log("Updated ticket:", ticket);
  return ticket;
};

/**
 * Get full conversation history for a ticket (all senders)
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {number} limit - Max messages to return (default 50)
 * @returns {Promise<Array>} - Array of messages sorted oldest first
 */
export const getConversationHistory = async (ticketId, limit = 50) => {
  const messages = await Message.find({ ticketId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
  return messages;
};

/**
 * Get available approved agents for a tenant (for reassignment dropdown)
 *
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Array>} - Array of agent objects
 */
export const getApprovedAgents = async (tenantId) => {
  const agents = await User.find({
    tenantId,
    role: { $in: ['agent', 'admin'] },
    isApproved: true,
  }).select('name email isOnline').lean();
  return agents;
};
