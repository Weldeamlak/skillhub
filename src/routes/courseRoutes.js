// src/routes/courseRoutes.js
import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  uploadCourseThumbnail,
} from "../controllers/courseControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateCourse } from "../middleware/courseValidationMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

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

// ✅ Upload course thumbnail
router.patch(
  "/:id/thumbnail",
  protect,
  authorizeRoles("instructor", "admin"),
  upload.single("thumbnail"),
  uploadCourseThumbnail
);

// Admin - Delete a course
router.delete("/:id", protect, authorizeRoles("admin"), deleteCourse);

export default router;
