import { 
  getMyAnalytics, 
  getCourseHeatmap,
  getSalesTrend,
  getCourseBreakdown,
  getAdminGlobalStats
} from "../controllers/analyticsControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Instructor summary
router.get("/my-summary", protect, authorizeRoles("instructor", "admin"), getMyAnalytics);

// Sales performance over time
router.get("/sales-trend", protect, authorizeRoles("instructor", "admin"), getSalesTrend);

// Revenue per course breakdown
router.get("/course-breakdown", protect, authorizeRoles("instructor", "admin"), getCourseBreakdown);

// Course engagement heatmap
router.get("/course-heatmap/:courseId", protect, authorizeRoles("instructor", "admin"), getCourseHeatmap);

// Global Platform Analytics (Admin Only)
router.get("/admin-stats", protect, authorizeRoles("admin"), getAdminGlobalStats);

export default router;
