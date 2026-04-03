import { submitQuizService, getUserCourseProgressService, submitAssignmentService } from "../services/progressService.js";
import { logInfo, logError } from "../logs/logger.js";

export const getMyProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const progress = await getUserCourseProgressService(req.user._id, courseId);
    res.status(200).json(progress);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { lessonId, answers } = req.body;
    if (!lessonId || !answers) {
      return res.status(400).json({ message: "LessonId and answers are required" });
    }

    const result = await submitQuizService(req.user._id, lessonId, answers);
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { lessonId, projectLink } = req.body;
    if (!lessonId || !projectLink) {
      return res.status(400).json({ message: "LessonId and projectLink are required" });
    }

    const result = await submitAssignmentService(req.user._id, lessonId, projectLink);
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

