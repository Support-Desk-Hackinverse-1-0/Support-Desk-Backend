
import * as adminService from "../service/admin.service.js";
import AppError from "../utils/appError.js";

export const getUsers = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const users = await adminService.getUsers(tenantId);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getUsers:", err);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved } = req.body;
    const { tenantId } = req.user;

    const user = await adminService.approveUser(
      userId,
      isApproved,
      tenantId
    );

    return res.status(200).json({
      success: true,
      message: "User approval updated",
      data: user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in approveUser:", err);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId } = req.user;

    const user = await adminService.suspendUser(userId, tenantId);

    return res.status(200).json({
      success: true,
      message: "Agent suspended successfully",
      data: user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in suspendUser:", err);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const { tenantId, id: adminId } = req.user;

    const user = await adminService.updateUserRole(
      userId,
      role,
      tenantId,
      adminId
    );

    return res.status(200).json({
      success: true,
      message: "User role updated",
      data: user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in updateUserRole:", err);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const stats = await adminService.getStats(tenantId);

    return res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data: stats,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    console.error("Error in getStats:", err);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};


export const addTenantContext = async (req, res) => {
    try {
      const { tenantId } = req.user;
      const file = req.file;
      const tenant = await adminService.addAicontextService(tenantId, file);

      return res.status(200).json({
        success: true,
        message: "AI context added successfully",
        data: tenant,
      });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in addTenantContext:", err);
         return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
}

export const updateIntegrations = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { integrations } = req.body;

        if (!Array.isArray(integrations)) {
            return res.status(400).json({
                success: false,
                message: "integrations must be an array"
            });
        }

        const tenant = await adminService.updateIntegrations(tenantId, integrations);

        return res.status(200).json({
            success: true,
            message: "Integrations updated successfully",
            data: tenant,
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }
        console.error("Error in updateIntegrations:", err);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
}