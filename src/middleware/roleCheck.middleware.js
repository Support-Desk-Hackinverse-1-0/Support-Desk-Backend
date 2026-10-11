/**
 * Admin Role Check Middleware
 * Verifies user has admin role
 */
export const adminRoleCheck = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking admin role",
    });
  }
};

/**
 * Agent Role Check Middleware
 * Verifies user has agent or admin role
 */
export const agentRoleCheck = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== "agent" && req.user.role !== "admin")) {
      return res.status(403).json({
        success: false,
        message: "Agent or Admin access required",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking agent role",
    });
  }
};
