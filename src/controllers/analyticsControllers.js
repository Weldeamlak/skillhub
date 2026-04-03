import { getInstructorAnalytics, getEngagementHeatmap } from "../services/analyticsService.js";
import { logError } from "../logs/logger.js";

// Instructor dashboard summary
export const getMyAnalytics = async (req, res) => {
  try {
    const stats = await getInstructorAnalytics(req.user._id);
    res.status(200).json(stats);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Course engagement heatmap (how many students are stuck in each lesson)
export const getCourseHeatmap = async (req, res) => {
  try {
    const { courseId } = req.params;
    const heatmap = await getEngagementHeatmap(courseId);
    res.status(200).json(heatmap);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};
