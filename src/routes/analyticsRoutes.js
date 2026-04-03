import express from "express";
import { getMyAnalytics, getCourseHeatmap } from "../controllers/analyticsControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Instructor summary
router.get("/my-summary", protect, authorizeRoles("instructor", "admin"), getMyAnalytics);

// Course engagement heatmap
router.get("/course-heatmap/:courseId", protect, authorizeRoles("instructor", "admin"), getCourseHeatmap);

export default router;
