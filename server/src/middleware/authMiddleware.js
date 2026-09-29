const jwt = require("jsonwebtoken");

// ==========================================
// PROTECT ROUTE
// ==========================================

const protect = (req, res, next) => {
  try {
    // ----------------------------------------
    // Get Authorization header
    // ----------------------------------------

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ----------------------------------------
    // Extract token
    // ----------------------------------------

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // ----------------------------------------
    // Verify JWT
    // ----------------------------------------

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // ----------------------------------------
    // Attach user information
    // ----------------------------------------

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();

  } catch (error) {
    console.error(
      "❌ Auth middleware error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  protect,
};