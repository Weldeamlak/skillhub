import Progress from "../model/Progress.js";
import { logError } from "../logs/logger.js";

/**
 * Checks if a student is authorized to view a specific lesson.
 * Conditions:
 * 1. Must be enrolled in the course.
 * 2. Lesson status must be 'unlocked' or 'completed'.
 * 
 * Admins and Instructors (if they own the course) bypass this.
 */
export const canViewLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { _id: userId, role } = req.user;

    // Admins bypass
    if (role === "admin") return next();

    // Check progress
    const progress = await Progress.findOne({ user: userId, lesson: lessonId })
      .populate("course");
      
    if (!progress) {
      return res.status(403).json({ message: "Not enrolled or lesson not initialized for this user" });
    }

    // Instructors bypass for their own courses
    if (role === "instructor" && progress.course.instructor.toString() === userId.toString()) {
      return next();
    }

    if (progress.status === "locked") {
      return res.status(403).json({ 
        message: "Lesson is locked. Please complete the previous lesson and its quiz first.",
        status: "locked" 
      });
    }

    next();
  } catch (error) {
    logError(`Gating error: ${error.message}`);
    res.status(500).json({ message: "Authorization check meta-failure" });
  }
};
