import mongoose from "mongoose";
import Payment from "../model/Payment.js";
import Progress from "../model/Progress.js";
import Enrollment from "../model/Enrollment.js";
import Course from "../model/Course.js";
import User from "../model/User.js";
import { logError } from "../logs/logger.js";

/**
 * Instructor Analytics Dashboard Summary
 */
export const getInstructorAnalytics = async (instructorId) => {
  try {
    const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

    // Total Earnings & Enrollment (Success only)
    const revenueStats = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructor": instructorObjectId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          instructorShare: { $sum: "$instructorShare" },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    // Active Student Count
    const studentCount = await Enrollment.countDocuments({
       course: { $in: await Course.find({ instructor: instructorId, isDeleted: false }).distinct('_id') }
    });

    return {
      revenue: revenueStats[0] || { totalRevenue: 0, instructorShare: 0, totalSales: 0 },
      activeStudents: studentCount,
    };
  } catch (error) {
    logError(`Instructor Analytics error: ${error.message}`);
    throw error;
  }
};

/**
 * Lesson Engagement Heatmap: Identifies lessons where students drop-off
 */
export const getEngagementHeatmap = async (courseId) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments({ course: courseId });
    if (totalEnrollments === 0) return [];

    const stats = await Progress.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: "$lesson",
          completedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } 
          },
          avgAttempts: { $avg: "$attempts" },
          avgScore: { $avg: "$quizScore" },
        }
      },
      {
        $lookup: {
          from: "lessons",
          localField: "_id",
          foreignField: "_id",
          as: "lessonInfo",
        }
      },
      { $unwind: "$lessonInfo" },
      { $sort: { "lessonInfo.order": 1 } },
      {
        $project: {
          _id: 1,
          title: "$lessonInfo.title",
          order: "$lessonInfo.order",
          completionRate: { 
            $multiply: [{ $divide: ["$completedCount", totalEnrollments] }, 100] 
          },
          difficultyIndex: "$avgAttempts", // higher means more struggle
          avgScore: 1,
        }
      }
    ]);

    return stats;
  } catch (error) {
    logError(`Engagement Heatmap error: ${error.message}`);
    throw error;
  }
};

/**
 * Get daily sales trend for an instructor (default last 30 days)
 */
export const getSalesTrendService = async (instructorId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Payment.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructor": new mongoose.Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          amount: 1,
          salesCount: 1,
        },
      },
    ]);

    return stats;
  } catch (error) {
    logError(`Sales Trend error: ${error.message}`);
    throw error;
  }
};

/**
 * Get revenue breakdown by course for an instructor
 */
export const getCourseRevenueBreakdownService = async (instructorId) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructor": new mongoose.Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: "$course",
          courseTitle: { $first: "$courseInfo.title" },
          revenue: { $sum: "$amount" },
          sales: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return stats;
  } catch (error) {
    logError(`Course Breakdown error: ${error.message}`);
    throw error;
  }
};

/**
 * Global Platform Analytics (Admin Only)
 */
export const getGlobalAdminStatsService = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments({ isDeleted: false });
    const totalEnrollments = await Enrollment.countDocuments();

    const revenueStats = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          platformCommission: { $sum: "$platformShare" },
        },
      },
    ]);

    const topInstructors = await User.find({ role: "instructor" })
      .sort({ earnings: -1 })
      .limit(5)
      .select("username email earnings");

    return {
      overview: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        platformCommission: revenueStats[0]?.platformCommission || 0,
      },
      topInstructors,
    };
  } catch (error) {
    logError(`Global Admin Stats error: ${error.message}`);
    throw error;
  }
};
