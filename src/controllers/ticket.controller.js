import * as ticketService from "../service/ticket.service.js";
import AppError from "../utils/appError.js";

export const createTicket = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const ticket = await ticketService.createTicket(req.body, tenantId);

    return res.status(201).json({
      success: true,
      message: "Ticket created",
      data: ticket,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in createTicket:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { tenantId, role, id: userId } = req.user;

    const result = await ticketService.getTickets(req.query, tenantId, role, userId);

    return res.status(200).json({
      success: true,
      message: "Tickets fetched",
      data: result,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getTickets:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

/**
 * @route GET /api/tickets/:ticketId
 * @desc Get a single ticket with full agent/customer info
 * @access Private (agent/admin)
 */
export const getTicketById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { ticketId } = req.params;

    const ticket = await ticketService.getTicketById(ticketId, tenantId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in getTicketById:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

/**
 * @route PATCH /api/tickets/:ticketId/status
 * @desc Update ticket status (agent: own tickets only; admin: all)
 * @access Private (agent/admin)
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { tenantId, role, id: userId } = req.user;
    const { ticketId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["open", "assigned", "resolved"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const ticket = await ticketService.updateTicketStatus(ticketId, tenantId, status, userId, role);

    return res.status(200).json({
      success: true,
      message: "Ticket status updated",
      data: ticket,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in updateTicketStatus:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

/**
 * @route PATCH /api/tickets/:ticketId/assign
 * @desc Reassign a ticket to a different agent (admin only)
 * @access Admin only
 */
export const assignTicket = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { ticketId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, message: "agentId is required" });
    }

    const ticket = await ticketService.assignTicket(ticketId, tenantId, agentId);

    return res.status(200).json({
      success: true,
      message: "Ticket reassigned successfully",
      data: ticket,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Error in assignTicket:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};