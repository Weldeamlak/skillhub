// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import env from "../config/env.js";

// ✅ Verify user token
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    // ✅ Fix #7: Guard against deleted users — token is valid but account is gone
    if (!req.user) {
      return res.status(401).json({ message: "User account no longer exists" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Check role permissions
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};

