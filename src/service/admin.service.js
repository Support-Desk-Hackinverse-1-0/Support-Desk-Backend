import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import AppError from "../utils/appError.js";
import * as userDAO from "../dao/user.dao.js";
import * as ticketDAO from "../dao/ticket.dao.js";
import { uploadFile } from "./storage.service.js";
import { getEmbeddings } from "../utils/getEmbeddings.js";
import { index } from "../config/vectorDb.js"
import * as tenantDAO from "../dao/tenant.dao.js";

/**
 * Get all users in a tenant
 *
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Array>} - List of users excluding password
 */
export const getUsers = async (tenantId) => {
  return await userDAO.getUsersByTenant(tenantId);
};

/**
 * Approve or suspend a user (toggle isApproved)
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {boolean} isApproved - New approval status (true = approve, false = suspend)
 * @param {string} tenantId - MongoDB ObjectId of the tenant (for security check)
 * @returns {Promise<Object>} - Updated user object
 */
export const approveUser = async (userId, isApproved, tenantId) => {
  const user = await userDAO.getUserByIdAndTenant(userId, tenantId);

  if (!user) throw new AppError("User not found", 404);

  if (user.role === "admin") {
    throw new AppError("Cannot modify approval status of an admin", 403);
  }

  user.isApproved = isApproved;

  // If suspending, also mark the agent as offline
  if (!isApproved) {
    user.isOnline = false;
  }

  await user.save();

  return user;
};

/**
 * Suspend a specific user (set isApproved = false, isOnline = false)
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - Updated user object
 */
export const suspendUser = async (userId, tenantId) => {
  return await approveUser(userId, false, tenantId);
};

/**
 * Update user role
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} role - New role for the user
 * @param {string} tenantId - MongoDB ObjectId of the tenant (for security check)
 * @param {string} adminId - MongoDB ObjectId of the admin making the change (prevents self-role change)
 * @returns {Promise<Object>} - Updated user object
 */
export const updateUserRole = async (userId, role, tenantId, adminId) => {
  if (adminId === userId) {
    throw new AppError("Cannot change your own role", 403);
  }

  const user = await userDAO.getUserByIdAndTenant(userId, tenantId);

  if (!user) throw new AppError("User not found", 404);

  user.role = role;

  if (role === "agent") {
    user.isApproved = false;
  }

  await user.save();

  return user;
};

/**
 * Get dashboard statistics for a tenant
 *
 * @param {string} tenantId - MongoDB ObjectId of the tenant
 * @returns {Promise<Object>} - Dashboard statistics
 */
export const getStats = async (tenantId) => {
  const totalTickets = await ticketDAO.countTicketsByTenant(tenantId);
  const openTickets = await ticketDAO.countTicketsByStatus(tenantId, "open");
  const assignedTickets = await ticketDAO.countTicketsByStatus(tenantId, "assigned");
  const resolvedTickets = await ticketDAO.countTicketsByStatus(tenantId, "resolved");

  const totalAgents = await userDAO.countUsersByTenantAndRole(tenantId, "agent");
  const approvedAgents = await userDAO.countUsersByTenantRoleAndApproval(tenantId, "agent", true);

  const pendingApproval = totalAgents - approvedAgents;

  const resolutionRate =
    totalTickets === 0
      ? 0
      : (resolvedTickets / totalTickets) * 100;

  return {
    totalTickets,
    openTickets,
    assignedTickets,
    resolvedTickets,
    totalAgents,
    approvedAgents,
    pendingApproval,
    resolutionRate,
  };
};


export const addAicontextService = async (tenantId, file) => {
  try {
    if (!file) {
      throw new AppError("No file uploaded", 400);
    }
    const result = await uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: "tenant-context",
    })
    console.log("File uploaded to ImageKit:", result.url, result); // Debug log

    // Save buffer to temporary file for PDFLoader
    const tempDir = "./temp";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      const loader = new PDFLoader(tempFilePath);
      const documents = await loader.load();

      // Extract and normalize text for better chunk quality
      let text = documents.map(doc => doc.pageContent).join("\n");

      console.log(`[addAicontextService] Raw extracted text length: ${text.length} chars`);

      // Text normalization for better chunking:
      // 1. Replace multiple whitespaces with single space
      text = text.replace(/\s+/g, ' ');
      // 2. Properly format FAQ structure with double newlines
      text = text.replace(/(\?)\s+([A-Z])/g, '$1\n\n$2');
      text = text.replace(/\n([A-Z].*?\?)/g, '\n\nQ: $1');
      // 3. Add proper line breaks for readability
      text = text.replace(/\.\s+/g, '.\n');
      // 4. Clean up extra spaces
      text = text.trim();

      console.log(`[addAicontextService] Normalized text length: ${text.length} chars`);
      console.log("=".repeat(50));

      const embeddings = await getEmbeddings(text);
      console.log(`[addAicontextService] Number of chunks created: ${embeddings.length}`);

      // Verify chunks aren't empty
      const validEmbeddings = embeddings.filter(e => e.chunk && e.chunk.trim().length > 0);
      console.log(`[addAicontextService] Valid chunks after filtering: ${validEmbeddings.length}`);

      if (validEmbeddings.length === 0) {
        throw new AppError("No valid content chunks created from PDF", 400);
      }

      await index.upsert({
        records: validEmbeddings.map((item, index) => ({
          id: `${tenantId}-${file.originalname}-${index}`,
          values: item.embedding,
          metadata: {
            tenantId,
            text: item.chunk,
            source: file.originalname,
          }
        }))
      });

      console.log(`[addAicontextService] Successfully upserted ${validEmbeddings.length} chunks to Pinecone`);
      const tenant = await tenantDAO.addAIContext(tenantId, result.url);
      return tenant;
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (err) {
    throw err;
  }
}

export const updateIntegrations = async (tenantId, integrations) => {
  // Encrypt API keys if necessary
  const { encrypt } = await import('../utils/encryption.js');
  const processedIntegrations = integrations.map(int => {
    if (int.auth && int.auth.key && !int.auth.key.includes(':')) {
      // Basic check if already encrypted (our format is iv:encrypted)
      int.auth.key = encrypt(int.auth.key);
    }
    return int;
  });

  const tenant = await tenantDAO.getTenantById(tenantId);
  if (!tenant) throw new AppError("Tenant not found", 404);

  tenant.integrations = processedIntegrations;
  await tenant.save();

  return tenant;
}