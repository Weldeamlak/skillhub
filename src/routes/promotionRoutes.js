import express from "express";
import { body, query } from "express-validator";
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotionControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin create promotion
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  body("code").isString().notEmpty().withMessage("Code is required"),
  body("discountType")
    .isIn(["percentage", "fixed"])
    .withMessage("Invalid discount type"),
  body("discountValue")
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be > 0"),
  body("validFrom").isISO8601().toDate(),
  body("validTo").isISO8601().toDate(),
  createPromotion
);

// Public list with pagination and optional active filter
router.get(
  "/",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("active").optional().isBoolean(),
  getPromotions
);

// Get single promo
router.get("/:id", getPromotionById);

// Admin update
router.put("/:id", protect, authorizeRoles("admin"), updatePromotion);

// Admin delete
router.delete("/:id", protect, authorizeRoles("admin"), deletePromotion);

export default router;
