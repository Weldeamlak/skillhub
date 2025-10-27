import express from "express";
import {
  createEnrollment,
  getAllEnrollments,
  getMyEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
} from "../controllers/enrollementControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create enrollment (student)
router.post("/", protect, createEnrollment);

// Get current user's enrollments
router.get("/me", protect, getMyEnrollments);

// Admin - get all enrollments
router.get("/", protect, authorizeRoles("admin"), getAllEnrollments);

// Get single enrollment
router.get("/:id", protect, getEnrollmentById);

// Update enrollment (progress/completed) - owner or admin
router.put("/:id", protect, updateEnrollment);

// Delete enrollment - owner or admin
router.delete("/:id", protect, deleteEnrollment);

export default router;
