import { 
  getInstructorAnalytics, 
  getEngagementHeatmap,
  getSalesTrendService,
  getCourseRevenueBreakdownService,
  getGlobalAdminStatsService
} from "../services/analyticsService.js";
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

// Sales performance over time
export const getSalesTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await getSalesTrendService(req.user._id, days);
    res.status(200).json(stats);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Revenue per course
export const getCourseBreakdown = async (req, res) => {
  try {
    const stats = await getCourseRevenueBreakdownService(req.user._id);
    res.status(200).json(stats);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Platform-wide admin stats
export const getAdminGlobalStats = async (req, res) => {
  try {
    const stats = await getGlobalAdminStatsService();
    res.status(200).json(stats);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};
