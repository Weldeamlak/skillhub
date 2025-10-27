import {
  createReviewService,
  getAllReviewsService,
  getReviewsByCourseService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
} from "../services/reviewService.js";
import { validationResult } from "express-validator";
import { logInfo, logError } from "../logs/logger.js";

export const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    // ensure comment is normalized (trim/collapse spaces) in case route sanitizer isn't applied
    if (req.body.comment && typeof req.body.comment === "string") {
      req.body.comment = req.body.comment.trim().replace(/\s+/g, " ");
    }
    const review = await createReviewService(req.body, req.user);
    logInfo(`Review created by ${req.user.email}`);
    res.status(201).json(review);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await getAllReviewsService();
    res.status(200).json(reviews);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getReviewsByCourse = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const result = await getReviewsByCourseService(req.params.courseId, {
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await getReviewByIdService(req.params.id);
    res.status(200).json(review);
  } catch (error) {
    logError(error.message);
    res.status(404).json({ message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const updated = await updateReviewService(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json(updated);
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    await deleteReviewService(req.params.id, req.user);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};
