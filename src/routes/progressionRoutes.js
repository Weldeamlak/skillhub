import express from "express";
import { getMyProgress, submitQuiz, submitAssignment } from "../controllers/progressionControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get current user's progress for a course
router.get("/:courseId", protect, getMyProgress);

// Submit quiz answers to mark completion and unlock next
router.post("/submit-quiz", protect, submitQuiz);

// Submit assignment/project URL to mark completion and unlock next
router.post("/submit-assignment", protect, submitAssignment);

export default router;
