import express from "express";
import { requestWithdrawal, processPayout, getPayoutHistory } from "../controllers/payoutControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Request withdrawal (instructor only)
router.post("/request", protect, authorizeRoles("instructor"), requestWithdrawal);

// View payout history (instructor or admin)
router.get("/history", protect, authorizeRoles("instructor", "admin"), getPayoutHistory);

// Process payout (admin only)
router.post("/process", protect, authorizeRoles("admin"), processPayout);

export default router;
