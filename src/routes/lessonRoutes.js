import express from "express";
import {
  createLessonController,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create a new lesson (Instructor or Admin)
router.post("/", protect, authorizeRoles("instructor", "admin"), createLessonController);

// ✅ Get all lessons (Public or Admin)
router.get("/", getAllLessons);

// ✅ Get a single lesson by ID (Public)
router.get("/:id", getLessonById);

// ✅ Update a lesson (Instructor or Admin)
router.put("/:id", protect, authorizeRoles("instructor", "admin"), updateLesson);

// ✅ Delete a lesson (Admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteLesson);

export default router;
