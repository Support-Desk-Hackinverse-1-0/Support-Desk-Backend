import * as authService from "../service/auth.service.js";
import { setToken } from "../utils/setToken.js";
import AppError from "../utils/appError.js";

export const registerTenant = async (req, res) => {
    try {
        const result = await authService.registerTenantWithAdmin(req.body);

        setToken(res,result.adminUser);

        return res.status(201).json({
            success: true,
            message: "Tenant and admin created successfully",
            data: result,
        });

    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in registerTenant:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const registerUser = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        setToken(res,user);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in registerUser:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authService.loginUser(email, password);
        setToken(res,user);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                isApproved: user.isApproved,
            },
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in loginUser:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
          });
  
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
  
    } catch (err) {
      console.error("Error in logoutUser:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

export const getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }   
        console.error("Error in getMe:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const getCurrentTenant = async (req, res) => {
    try {
        const slug = req.query.slug || req.params.slug;
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Tenant slug is required",
            });
        }
        const tenant = await authService.getCurrentTenant(slug);
        return res.status(200).json({
            success: true,
            data: tenant,
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in getCurrentTenant:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
  
      const result = await authService.updatePassword(
        userId,
        oldPassword,
        newPassword
      );
  
      return res.status(200).json({
        success: true,
        message: result,
      });
  
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
  
      console.error("Error in updatePassword:", err);
      return res.status(500).json({
        success: false,
        message: "server error",
      });
    }
  };