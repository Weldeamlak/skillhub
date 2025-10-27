import express from "express";
import { body, query } from "express-validator";
import {
  createReview,
  getAllReviews,
  getReviewsByCourse,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/reviewControllers.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create review (student) - must be enrolled and include a comment
router.post(
  "/",
  protect,
  body("course").isMongoId().withMessage("Valid course id is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  // trim and normalize whitespace: remove leading/trailing and collapse multiple spaces
  body("comment")
    .optional()
    .isString()
    .trim()
    .customSanitizer((val) => val.replace(/\s+/g, " "))
    .isLength({ min: 2, max: 300 })
    .withMessage("Comment must be between 2 and 300 characters"),
  createReview
);

// Get all reviews (admin)
router.get("/", protect, authorizeRoles("admin"), getAllReviews);

// Get reviews for a specific course (public) with pagination
router.get(
  "/course/:courseId",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  getReviewsByCourse
);

// Get single review
router.get("/:id", getReviewById);

// Update review (owner or admin)
router.put("/:id", protect, updateReview);

// Delete review (owner or admin)
router.delete("/:id", protect, deleteReview);

export default router;
