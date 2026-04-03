import express from "express";
import {
  createLessonController,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  uploadLessonVideo,
} from "../controllers/lessonControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { canViewLesson } from "../middleware/progressionMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ✅ Create a new lesson (Instructor or Admin)
router.post("/", protect, authorizeRoles("instructor", "admin"), createLessonController);

// ✅ Get all lessons (Enrolled students or Admins)
router.get("/", protect, getAllLessons);

// ✅ Get a single lesson by ID (Enrolled & Unlocked)
router.get("/:id", protect, canViewLesson, getLessonById);

// ✅ Update a lesson (Instructor or Admin)
router.put("/:id", protect, authorizeRoles("instructor", "admin"), updateLesson);

// ✅ Upload lesson video (Instructor or Admin)
router.patch(
  "/:id/video",
  protect,
  authorizeRoles("instructor", "admin"),
  upload.single("video"),
  uploadLessonVideo
);

// ✅ Delete a lesson (Admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteLesson);

export default router;
