import express from "express";
import { apiKeyMiddleware } from "../middleware/apiKey.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { agentRoleCheck } from "../middleware/roleCheck.middleware.js";
import * as messageController from "../controllers/message.controller.js";
import {
  sendMessageValidation,
  getMessagesValidation,
} from "../validation/message.validation.js";

const router = express.Router();

// ─── CUSTOMER WIDGET ROUTES (API Key authentication) ─────────────────────────

/**
 * @route GET /api/messages/widget-config
 * @desc Get the visual configuration for the widget
 * @access Public (requires API Key)
 */
router.get("/widget-config", apiKeyMiddleware, messageController.getWidgetConfig);

/**
 * @route POST /api/messages/send
 * @desc Send a customer message — AI responds or creates ticket
 * @access Public (requires API Key)
 */
router.post("/send", apiKeyMiddleware, sendMessageValidation, messageController.sendMessage);

/**
 * @route POST /api/messages/ticket/:ticketId
 * @desc Add a follow-up message to an existing ticket (customer)
 * @access Public (requires API Key)
 */
router.post("/ticket/:ticketId", apiKeyMiddleware, messageController.addMessageToTicket);

/**
 * @route GET /api/messages/customer/tickets
 * @desc Get all tickets for a customer widget by email
 * @access Public (requires API Key)
 */
router.get("/customer/tickets", apiKeyMiddleware, messageController.getCustomerTickets);

/**
 * @route GET /api/messages/:ticketId
 * @desc Get all messages for a ticket (customer widget polling)
 * @access Public (requires API Key)
 */
router.get("/:ticketId", apiKeyMiddleware, messageController.getTicketMessages);

/**
 * @route POST /api/messages/kb-query
 * @desc Query knowledge base directly
 * @access Public (requires API Key)
 */
router.post("/kb-query", apiKeyMiddleware, messageController.queryKnowledgeBase);

// ─── AGENT DASHBOARD ROUTES (JWT authentication) ─────────────────────────────

/**
 * @route GET /api/messages/agent/:ticketId
 * @desc Get full conversation thread for agent workspace
 * @access Private (agent/admin)
 */
router.get(
  "/agent/:ticketId",
  authMiddleware,
  agentRoleCheck,
  messageController.getAgentTicketMessages
);

/**
 * @route POST /api/messages/agent/reply/:ticketId
 * @desc Agent sends a reply to a customer's ticket
 * @access Private (agent/admin)
 */
router.post(
  "/agent/reply/:ticketId",
  authMiddleware,
  agentRoleCheck,
  messageController.agentReplyToTicket
);

/**
 * @route POST /api/messages/agent/ai-suggest/:ticketId
 * @desc Generate an AI reply suggestion for the agent
 * @access Private (agent/admin)
 */
router.post(
  "/agent/ai-suggest/:ticketId",
  authMiddleware,
  agentRoleCheck,
  messageController.getAISuggestion
);

export default router;
