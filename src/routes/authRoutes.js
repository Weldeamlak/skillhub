import express from "express";
import { login, register, logout, refresh, forgotPassword, resetPassword, verifyEmail } from "../controllers/authControllers.js";
import {
  validateRegister,
  validateLogin,
} from "../middleware/validationMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register route
router.post("/register", validateRegister, register);

// Login route
router.post("/login", validateLogin, login);

// Logout route
router.post("/logout", protect, logout);

// Refresh token route
router.post("/refresh", refresh);

// Forgot password route
router.post("/forgot-password", forgotPassword);

// Reset password route
router.patch("/reset-password/:token", resetPassword);

// Verify email route
router.patch("/verify-email/:token", verifyEmail);

export default router;
