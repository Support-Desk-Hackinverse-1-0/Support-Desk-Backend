import { ChatMistralAI } from "@langchain/mistralai";
import { config } from "../config/config.js";
import { index } from "../config/vectorDb.js";
import * as messageDAO from "../dao/message.dao.js";
import * as ticketDAO from "../dao/ticket.dao.js";
import AppError from "../utils/appError.js";
import { getEmbeddings } from "../utils/getEmbeddings.js";
import { tryTenantAPIs } from "./toolExecutor.service.js";

const mistralChat = new ChatMistralAI({
  apiKey: config.MISTRAL_KEY,
  model: config.MISTRAL_MODEL,
  temperature: 0.7,
});

const detectQueryType = async (message) => {
  try {
    const response = await mistralChat.invoke([
      {
        role: "user",
        content: `
Classify the following customer query into ONE of these categories:

1. GENERAL (questions about policies, services, info)
2. PERSONAL (questions about user's order, refund, account, status)

Rules:
- PERSONAL includes words like: my, refund status, my order, my account
- GENERAL includes: policy, how it works, pricing

Return ONLY one word: GENERAL or PERSONAL

Query: "${message}"
        `,
      },
    ]);

    return response.content.trim().toUpperCase().includes("PERSONAL")
      ? "PERSONAL"
      : "GENERAL";
  } catch (error) {
    console.warn("[detectQueryType] AI detection failed, using rule-based fallback:", error.message);
    const lower = message.toLowerCase();
    if (lower.includes("my") || lower.includes("order") || lower.includes("refund") || lower.includes("status")) {
      return "PERSONAL";
    }
    return "GENERAL";
  }
};



/**
 * Process customer message and generate AI response or create ticket
 *
 * @param {string} customerMessage - The customer's message
 * @param {string} customerEmail - Customer email
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - {response, ticketId, isTicketCreated, message}
 *
 * @description
 * - Creates a ticket
 * - Extracts keywords and queries vector DB for similar documents
 * - If relevant data found → generates AI response
 * - If no relevant data → assigns to available agent
 */
export const processCustomerMessage = async (
  customerMessage,
  customerEmail,
  tenantId
) => {
  try {


    // STEP 0: Keyword Guard (FAST)

    const sensitiveKeywords = [
        "track",
  "status",
  "not received",
  "where is",
  "refund status",
    ];

    const lowerMsg = customerMessage.toLowerCase();

    const isSensitive = sensitiveKeywords.some((keyword) =>
      lowerMsg.includes(keyword)
    );

    // ✅ STEP 1: Intent Detection (AI)
    const queryType = await detectQueryType(customerMessage);

    // ✅ STEP 2: HANDLE PERSONAL QUERIES
    // ================================
    const isActionQuery =
    lowerMsg.includes("track my") ||
    lowerMsg.includes("where is my") ||
    lowerMsg.includes("my order") ||
    lowerMsg.includes("not received") ||
    lowerMsg.includes("order status");

  if (isActionQuery || queryType === "PERSONAL") {
    // 🔌 Try Tenant APIs first
    const apiResult = await tryTenantAPIs({ tenantId, customerMessage });

    if (apiResult && apiResult.success) {
      return {
        success: true,
        isTicketCreated: false,
        ticketId: null,
        response: apiResult.response,
        message: "Query resolved from tenant APIs",
      };
    }

    // ❌ API failed → DIRECTLY go to agent (skip AI)

    // Step 3: Assign agent immediately
    const availableAgent = await messageDAO.getAvailableAgent(tenantId);

    let ticket;
    let notificationMessage;

    if (availableAgent) {
      ticket = await ticketDAO.createTicket({
        tenantId,
        customerEmail,
        subject: customerMessage.substring(0, 200),
        status: "assigned",
        assignedTo: availableAgent._id,
      });

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "customer",
        message: customerMessage,
      });

      notificationMessage = `I've connected you with ${availableAgent.name} for further assistance.`;

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: notificationMessage,
      });

      return {
        success: true,
        isTicketCreated: true,
        ticketId: ticket._id,
        assignedAgentId: availableAgent._id,
        response: notificationMessage,
      };
    } else {
      ticket = await ticketDAO.createTicket({
        tenantId,
        customerEmail,
        subject: customerMessage.substring(0, 200),
        status: "open",
      });

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "customer",
        message: customerMessage,
      });

      return {
        success: true,
        isTicketCreated: true,
        ticketId: ticket._id,
        response: "Your request has been sent to support team.",
      };
    }
  }

    // Step 1: Extract keywords and search Pinecone
    let searchQuery = customerMessage;
    try {
      const keywords = await mistralChat.invoke([
        {
          role: "user",
          content: `Extract the main topic or keywords from this customer query. Output ONLY the keywords, nothing else.\nQuery: "${customerMessage}"`,
        },
      ]);
      searchQuery = keywords.content || customerMessage;
    } catch (kwErr) {
      console.warn("[processCustomerMessage] Keyword extraction failed, using raw query:", kwErr.message);
    }

    const embeddingsData = await getEmbeddings(searchQuery);

    if (!embeddingsData || embeddingsData.length === 0) {
      throw new AppError("Failed to generate embeddings", 500);
    }

    const searchResults = await index.query({
      vector: embeddingsData[0].embedding,
      topK: 3,
      includeMetadata: true,
      filter: { tenantId: tenantId.toString() },
    });

    const SIMILARITY_THRESHOLD = 0.6;
    const relevantResults = searchResults.matches.filter(
      (match) => match.score >= SIMILARITY_THRESHOLD
    );

    // Step 2: If relevant data found, generate AI response
    if (
      relevantResults.length > 0 &&
      relevantResults[0].score > 0.65
    ){
      const contextData = relevantResults
        .map((match) => match.metadata?.text || "")
        .join("\n\n---\n\n");

      const aiPrompt = `You are a professional and friendly customer support assistant. Your task is to answer the customer's question accurately using only the information provided in the knowledge base below.

RULES:
- Answer based ONLY on the knowledge base information provided
- Be concise, clear, and professional
- If the knowledge base contains a direct answer, provide it confidently
- Format your response in a readable way
- If the knowledge base does NOT contain the answer, reply EXACTLY with "I DO NOT KNOW". Do not add any other text.

KNOWLEDGE BASE:
${contextData}

CUSTOMER QUESTION:
${customerMessage}

Provide a helpful, accurate answer:`;

      const aiResponse = await mistralChat.invoke([
        {
          role: "user",
          content: aiPrompt,
        },
      ]);

      const responseText = aiResponse.content || "I DO NOT KNOW";

      // ✅ Only accept if confident
      if (
        !responseText.toLowerCase().includes("i do not know") &&
        relevantResults[0].score > 0.6
      ) {
        return {
          success: true,
          isTicketCreated: false,
          ticketId: null,
          response: responseText,
          message: "Query resolved from knowledge base",
          confidence: relevantResults[0].score,
        };
      }
    }

   

    // Step 2.5: Try Tenant APIs before falling back to agent
    const apiResult = await tryTenantAPIs({ tenantId, customerMessage });

    if (apiResult && apiResult.success) {
      return {
        success: true,
        isTicketCreated: false,
        ticketId: null,
        response: apiResult.response,
        message: "Query resolved from tenant APIs",
      };
    }

    // Step 3: No relevant data found - check for available agent
    const availableAgent = await messageDAO.getAvailableAgent(tenantId);
    let ticket;
    let notificationMessage;

    if (availableAgent) {
      // Create ticket and assign directly
      ticket = await ticketDAO.createTicket({
        tenantId,
        customerEmail,
        subject: customerMessage.substring(0, 200),
        status: "assigned",
        assignedTo: availableAgent._id,
      });

      // Save customer's initial message to the ticket thread
      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "customer",
        message: customerMessage,
      });

      notificationMessage = `I couldn't find an exact answer in our knowledge base, so I've transferred your chat to ${availableAgent.name}. They've been notified and will respond here shortly!\n\nFeel free to add any extra details that might help them.`;

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: notificationMessage,
      });

      return {
        success: true,
        isTicketCreated: true,
        ticketId: ticket._id,
        assignedAgentId: availableAgent._id,
        assignedAgentName: availableAgent.name,
        response: notificationMessage,
        message: "Ticket created and assigned to nearest available agent",
      };
    } else {
      // Create ticket with status open
      ticket = await ticketDAO.createTicket({
        tenantId,
        customerEmail,
        subject: customerMessage.substring(0, 200),
        status: "open",
      });

      // Save customer's initial message to the ticket thread
      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "customer",
        message: customerMessage,
      });

      notificationMessage = `I'm unable to answer that from our knowledge base. I've successfully escalated your request to our human support team! \n\nThey will review this conversation and get back to you as soon as they are available. Ticket reference: #${ticket._id.toString().slice(-8).toUpperCase()}`;

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: notificationMessage,
      });

      return {
        success: true,
        isTicketCreated: true,
        ticketId: ticket._id,
        assignedAgentId: null,
        response: notificationMessage,
        message: "Ticket created and left in queue",
      };
    }


  } catch (error) {
    console.error("Error in processCustomerMessage:", error);
    try {
      // Fallback: create a ticket so the customer query is never lost
      const availableAgent = await messageDAO.getAvailableAgent(tenantId);
      const ticket = await ticketDAO.createTicket({
        tenantId,
        customerEmail,
        subject: customerMessage.substring(0, 200),
        status: availableAgent ? "assigned" : "open",
        assignedTo: availableAgent ? availableAgent._id : null,
      });

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "customer",
        message: customerMessage,
      });

      const fallbackMsg = availableAgent
        ? `I've forwarded your request to ${availableAgent.name} who will help you shortly.`
        : "Thank you for reaching out. We've created a support ticket and our team will get back to you shortly.";

      await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: fallbackMsg,
      });

      return {
        success: true,
        isTicketCreated: true,
        ticketId: ticket._id,
        assignedAgentId: availableAgent ? availableAgent._id : null,
        response: fallbackMsg,
        message: "Escalated to agent queue due to processing fallback",
      };
    } catch (fallbackError) {
      console.error("Fallback ticket creation failed:", fallbackError);
      throw new AppError("Failed to process message with AI", 500);
    }
  }
};

/**
 * Generate an AI reply suggestion for a human agent
 *
 * @param {string} ticketId - MongoDB ObjectId of the ticket
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<string>} - AI-suggested reply text
 */
export const generateAgentReplySuggestion = async (ticketId, tenantId) => {
  try {
    const messages = await messageDAO.getConversationHistory(ticketId, 10);

    if (!messages || messages.length === 0) {
      throw new AppError("No conversation history found for this ticket", 404);
    }

    const latestCustomerMsg = [...messages]
      .reverse()
      .find((m) => m.sender === "customer");

    if (!latestCustomerMsg) {
      throw new AppError("No customer message found in ticket", 404);
    }

    const conversationContext = messages
      .map((m) => {
        const role =
          m.sender === "customer"
            ? "Customer"
            : m.sender === "agent"
              ? "Support Agent"
              : "AI";
        return `[${role}]: ${m.message}`;
      })
      .join("\n");

    // Query KB for relevant context
    let kbContext = "";
    try {
      const embeddingsData = await getEmbeddings(latestCustomerMsg.message);
      if (embeddingsData && embeddingsData.length > 0) {
        const searchResults = await index.query({
          vector: embeddingsData[0].embedding,
          topK: 3,
          includeMetadata: true,
        });
        const relevant = searchResults.matches.filter((m) => m.score >= 0.35);
        if (relevant.length > 0) {
          kbContext = relevant.map((r) => r.metadata?.text || "").join("\n\n");
        }
      }
    } catch (kbError) {
      console.warn("[generateAgentReplySuggestion] KB query failed:", kbError.message);
    }

    const prompt = `You are an experienced customer support specialist helping a human agent craft a professional reply.

CONVERSATION HISTORY:
${conversationContext}

${kbContext ? `RELEVANT KNOWLEDGE BASE INFORMATION:\n${kbContext}\n` : ""}
TASK: Write a professional, empathetic reply from the support agent to the customer's latest message. The reply should:
- Directly address the customer's specific question or concern
- Be warm but professional in tone
- Be concise (2-4 sentences unless a detailed response is needed)
- NOT start with "I" — vary the sentence structure
- NOT include filler phrases like "Certainly!", "Of course!", "Absolutely!"
- Sound like it was written by a human, not a bot

Write ONLY the reply text (no labels, no preamble):`;

    const aiResponse = await mistralChat.invoke([{ role: "user", content: prompt }]);

    return (
      aiResponse.content ||
      "Thank you for reaching out. Let me look into this for you right away."
    );
  } catch (error) {
    console.error("Error in generateAgentReplySuggestion:", error);
    throw error;
  }
};

/**
 * Generate AI response for a message (for existing tickets)
 *
 * @param {string} message - The message content
 * @param {Array} conversationContext - Previous messages for context
 * @returns {Promise<string>} - AI generated response
 */
export const generateAIResponse = async (message, conversationContext = []) => {
  try {
    const contextString = conversationContext
      .slice(-5)
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join("\n");

    const prompt = `You are a helpful support agent. Here is the conversation context:\n\n${contextString}\n\nCustomer: ${message}\n\nProvide a helpful response.`;

    const aiResponse = await mistralChat.invoke([{ role: "user", content: prompt }]);

    return aiResponse.content || "I apologize for the inconvenience.";
  } catch (error) {
    console.error("Error in generateAIResponse:", error);
    throw error;
  }
};

/**
 * Query vector DB with a query string
 *
 * @param {string} query - The search query
 * @param {number} topK - Number of top results to return
 * @returns {Promise<Array>} - Array of matching documents with metadata
 */
export const queryVectorDB = async (query, topK = 5) => {
  try {
    const embeddingsData = await getEmbeddings(query);

    if (!embeddingsData || embeddingsData.length === 0) {
      throw new AppError("Failed to generate embeddings", 500);
    }

    const queryEmbedding = embeddingsData[0].embedding;

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.matches;
  } catch (error) {
    console.error("Error in queryVectorDB:", error);
    throw error;
  }
};

/**
 * Process a follow-up message from a customer
 */
export const processFollowUpMessage = async (ticket, messageContent, tenantId) => {
  try {
    // If ticket is already connected/assigned to a human agent, AI must NOT write on its own
    if (ticket.assignedTo || ticket.status === "assigned") {
      return null;
    }

    const trimmed = messageContent.trim().toLowerCase();

    // 1. Handle common conversational acknowledgments / closings gracefully
    const acknowledgments = ["ok", "okay", "ok thanks", "thanks", "thank you", "thx", "got it", "cool", "sure", "alright", "k", "great", "done", "bye"];
    if (acknowledgments.includes(trimmed)) {
      return await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: "You're welcome! Let us know if you need anything else.",
      });
    }

    // 2. Try to answer the customer's question using Knowledge Base / AI first
    let searchQuery = messageContent;
    try {
      const keywords = await mistralChat.invoke([
        {
          role: "user",
          content: `Extract the main topic or keywords from this customer query. Output ONLY the keywords, nothing else.\nQuery: "${messageContent}"`,
        },
      ]);
      searchQuery = keywords.content || messageContent;
    } catch (kwErr) {
      console.warn("[processFollowUpMessage] Keyword extraction failed, using raw query:", kwErr.message);
    }

    const embeddingsData = await getEmbeddings(searchQuery);
    if (embeddingsData && embeddingsData.length > 0) {
      const searchResults = await index.query({
        vector: embeddingsData[0].embedding,
        topK: 3,
        includeMetadata: true,
        filter: { tenantId: tenantId.toString() },
      });

      const SIMILARITY_THRESHOLD = 0.4;
      const relevantResults = searchResults.matches.filter(
        (match) => match.score >= SIMILARITY_THRESHOLD
      );

      if (relevantResults.length > 0) {
        const contextData = relevantResults
          .map((match) => match.metadata?.text || "")
          .join("\n\n---\n\n");

        const aiPrompt = `You are a professional and friendly customer support assistant. Answer the customer's question accurately using only the knowledge base below. If the knowledge base does not contain a direct answer, simply say "I don't know". Do not add anything else if you don't know.

KNOWLEDGE BASE:
${contextData}

CUSTOMER QUESTION:
${messageContent}

Provide a helpful, accurate answer:`;

        const aiResponse = await mistralChat.invoke([{ role: "user", content: aiPrompt }]);
        const responseText = aiResponse.content || "I don't know";

        if (!responseText.toLowerCase().includes("i don't know")) {
          return await messageDAO.createMessage({
            ticketId: ticket._id,
            sender: "ai",
            message: responseText,
          });
        }
      }
    }

    // 3. Try tenant APIs if applicable
    const apiResult = await tryTenantAPIs({ tenantId, customerMessage: messageContent });
    if (apiResult && apiResult.success) {
      return await messageDAO.createMessage({
        ticketId: ticket._id,
        sender: "ai",
        message: apiResult.response,
      });
    }

    // 4. Only if AI and APIs cannot answer, acknowledge
    const ackMessage = ticket.assignedTo
      ? `I've noted this and added it to your ticket. Your assigned agent will review it shortly.`
      : `I've updated your ticket with this information. Our support team will review it as soon as possible.`;

    return await messageDAO.createMessage({
      ticketId: ticket._id,
      sender: "ai",
      message: ackMessage,
    });
  } catch (error) {
    console.error("Error in processFollowUpMessage:", error);
    return null;
  }
};
