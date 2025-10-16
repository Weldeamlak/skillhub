// src/routes/courseRoutes.js
import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/courseControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateCourse } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Public - Get all courses
router.get("/", getCourses);

// Public - Get a course by ID
router.get("/:id", getCourseById);

// Instructor/Admin - Create a course
router.post(
  "/",
  protect,
  authorizeRoles("instructor", "admin"),
  validateCourse,
  createCourse
);

// Instructor/Admin - Update a course
router.put(
  "/:id",
  protect,
  authorizeRoles("instructor", "admin"),
  validateCourse,
  updateCourse
);

// Admin - Delete a course
router.delete("/:id", protect, authorizeRoles("admin"), deleteCourse);

export default router;
