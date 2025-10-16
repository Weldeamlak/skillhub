import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Admin only - get all users
router.get("/", protect, authorizeRoles("admin"), getAllUsers);

// 🔒 Admin or user themself - get one user
router.get("/:id", protect, getUserById);

// 🔒 Anyone can create an account (register)
router.post("/", createUser);

// 🔒 Logged-in user can update their data
router.put("/:id", protect, updateUser);

// 🔒 Admin only - delete user
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;
