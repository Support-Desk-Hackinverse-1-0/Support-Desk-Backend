import * as tenantDAO from "../dao/tenant.dao.js";
import * as userDAO from "../dao/user.dao.js";
import mongoose from "mongoose";
import AppError from "../utils/appError.js";

export const registerTenantWithAdmin = async (data) => {
    const { name, slug, supportEmail, adminName, adminEmail, password } = data;

    const existingTenant = await tenantDAO.getTenantBySlug(slug);
    if (existingTenant) {
        throw new AppError("Slug already exists. Please choose a different slug.", 400);
    }

    const existingUser = await userDAO.getUserByEmail(adminEmail);
    if (existingUser) {
        throw new AppError("Email already in use. Please choose a different email.", 400);
    }

    let session = null;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        // 1. Create Tenant
        const tenant = await tenantDAO.createTenant(
            { name, slug, supportEmail },
            session
        );

        // 2. Create Admin User
        const adminUser = await userDAO.createUser(
            {
                name: adminName,
                email: adminEmail,
                password,
                role: "admin",
                tenantId: tenant._id,
            },
            session
        );

        await session.commitTransaction();
        session.endSession();

        return {
            tenant,
            adminUser,
        };
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (_) {}
            try {
                session.endSession();
            } catch (_) {}
        }

        // Standalone MongoDB (common in local environments) does not support replica set transactions.
        // Fall back to sequential creation.
        if (
            error?.message?.includes("replica set") ||
            error?.code === 20 ||
            error?.codeName === "IllegalOperation"
        ) {
            const tenant = await tenantDAO.createTenant({ name, slug, supportEmail });
            try {
                const adminUser = await userDAO.createUser({
                    name: adminName,
                    email: adminEmail,
                    password,
                    role: "admin",
                    tenantId: tenant._id,
                });

                return {
                    tenant,
                    adminUser,
                };
            } catch (createErr) {
                // If creating admin fails, clean up the tenant
                try {
                    await (await import("../models/tenant.model.js")).default.findByIdAndDelete(tenant._id);
                } catch (_) {}
                throw createErr;
            }
        }

        throw error;
    }
};


export const registerUser = async (data) => {
    const { name, email, password, tenantId } = data;

    const existingUser = await userDAO.getUserByEmail(email);
    if (existingUser) {
        throw new AppError("Email already in use. Please choose a different email.", 400);
    }

    const user = await userDAO.createUser({
        name,
        email,
        password,
        tenantId,
        role: "agent",
    });
    return user;
}

export const loginUser = async (email, password) => {
    const user = await userDAO.getUserByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    return user;
}

export const getMe = async (userId) => {
    const user = await userDAO.getUserById(userId);
    if (!user) {
        throw new AppError("User not found", 404);
    }
    return user;
}

export const getCurrentTenant = async (slug) => {
    const tenant = await tenantDAO.getTenantBySlug(slug);
    if (!tenant) {
        throw new AppError("Tenant not found", 404);
    }
    return tenant;
}

export const updatePassword = async (
    userId,
    oldPassword,
    newPassword
  ) => {
  
    if (!oldPassword || !newPassword) {
      throw new AppError("All fields are required", 400);
    }
  
    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }
  
    if (oldPassword === newPassword) {
      throw new AppError("New password must be different", 400);
    }
  
    const user = await userDAO.getUserByIdWithPassword(userId);
  
    if (!user) {
      throw new AppError("User not found", 404);
    }
  
    // compare old password
    const isMatch = await user.comparePassword(oldPassword);
  
    if (!isMatch) {
      throw new AppError("Old password is incorrect", 401);
    }
  
    // set new password (pre-save will hash)
    user.password = newPassword;
  
    await user.save();
  
    return "Password updated successfully";
  };