import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { agentRoleCheck } from "../middleware/roleCheck.middleware.js";
import { adminRoleCheck } from "../middleware/roleCheck.middleware.js";
import * as ticketController from "../controllers/ticket.controller.js";
import { createTicketValidation, getTicketsValidation } from "../validation/ticket.validation.js";

const router = express.Router();

/**
 * @route POST /api/tickets
 * @desc Create ticket
 */
router.post("/", authMiddleware, createTicketValidation, ticketController.createTicket);

/**
 * @route GET /api/tickets
 * @desc List tickets (agents see their own; admins see all)
 */
router.get("/", authMiddleware, getTicketsValidation, ticketController.getTickets);

/**
 * @route GET /api/tickets/:ticketId
 * @desc Get a single ticket with populated assignedTo
 * @access Agent + Admin
 */
router.get("/:ticketId", authMiddleware, agentRoleCheck, ticketController.getTicketById);

/**
 * @route PATCH /api/tickets/:ticketId/status
 * @desc Update ticket status (agent: own tickets; admin: all)
 * @access Agent + Admin
 */
router.patch("/:ticketId/status", authMiddleware, agentRoleCheck, ticketController.updateTicketStatus);

/**
 * @route PATCH /api/tickets/:ticketId/assign
 * @desc Reassign ticket to a different agent
 * @access Admin only
 */
router.patch("/:ticketId/assign", authMiddleware, adminRoleCheck, ticketController.assignTicket);

export default router;