import express from "express";
import {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  initChapa,
  chapaVerify,
  getUnpaidPayouts,
  markPaymentPaid,
} from "../controllers/paymentControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { verifyChapaSignature } from "../middleware/chapaWebhookMiddleware.js"; // ✅ Security: Chapa HMAC

const router = express.Router();

// Create a payment (logged in users)
router.post("/", protect, createPayment);

// Initialize chapa (returns checkout url)
router.post("/chapa/init", protect, initChapa);

// ✅ Security fix: Chapa webhook — verify HMAC signature before processing
router.post("/chapa/verify", verifyChapaSignature, chapaVerify);

// Admin - list unpaid payouts
router.get(
  "/unpaid-payouts",
  protect,
  authorizeRoles("admin"),
  getUnpaidPayouts
);

// Admin - mark a payment as paid (after you perform the payout manually)
router.post(
  "/:id/mark-paid",
  protect,
  authorizeRoles("admin"),
  markPaymentPaid
);

// Get current user's payments
router.get("/me", protect, getMyPayments);

// Admin - get all payments (now paginated)
router.get("/", protect, authorizeRoles("admin"), getAllPayments);

// Get single payment
router.get("/:id", protect, getPaymentById);

// Update payment (owner or admin)
router.put("/:id", protect, updatePayment);

// Delete payment (owner or admin)
router.delete("/:id", protect, deletePayment);

export default router;

