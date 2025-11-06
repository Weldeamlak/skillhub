import Review from "../model/Review.js";
import Course from "../model/Course.js";
import Enrollment from "../model/Enrollement.js";
import { logInfo, logError } from "../logs/logger.js";

const recalcCourseRating = async (courseId) => {
  const reviews = await Review.find({ course: courseId });
  const numReviews = reviews.length;
  const rating =
    numReviews === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / numReviews;
  await Course.findByIdAndUpdate(courseId, { rating, numReviews });
};

export const createReviewService = async (reviewData, user) => {
  try {
    const { course, rating, comment } = reviewData;

    // ensure user is enrolled in the course
    const enrolled = await Enrollment.findOne({ course, student: user._id });
    if (!enrolled)
      throw new Error("Only students enrolled in this course can review it");

    // ensure not already reviewed by same user
    const existing = await Review.findOne({ course, student: user._id });
    if (existing) throw new Error("You have already reviewed this course");

    const newReview = new Review({
      course,
      student: user._id,
      rating,
      comment,
    });
    const saved = await newReview.save();

    await recalcCourseRating(course);
    logInfo(`Review created: ${saved._id}`);
    return saved;
  } catch (error) {
    logError(`Error creating review: ${error.message}`);
    throw error;
  }
};

export const getAllReviewsService = async ({
  filter = {},
  options = null,
} = {}) => {
  const base = Review.find(filter)
    .populate("student", "username email")
    .populate("course", "title");
  if (!options) return await base.exec();

  const total = await Review.countDocuments(filter);
  const items = await base
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit)
    .select(options.select || undefined);
  return {
    items,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getReviewsByCourseService = async (
  courseId,
  { filter = {}, options = null } = {}
) => {
  filter = { ...(filter || {}), course: courseId };
  const base = Review.find(filter).populate("student", "username");
  if (!options) return await base.sort({ createdAt: -1 }).exec();

  const total = await Review.countDocuments(filter);
  const items = await base
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit)
    .select(options.select || undefined);
  return {
    items,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getReviewByIdService = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review not found");
  return review;
};

export const updateReviewService = async (id, updateData, user) => {
  try {
    const review = await Review.findById(id);
    if (!review) throw new Error("Review not found");

    if (
      review.student.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new Error("Not authorized to update this review");
    }

    Object.assign(review, updateData);
    const updated = await review.save();
    await recalcCourseRating(review.course);
    logInfo(`Review updated: ${updated._id}`);
    return updated;
  } catch (error) {
    logError(`Error updating review: ${error.message}`);
    throw error;
  }
};

export const deleteReviewService = async (id, user) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review not found");

  if (
    review.student.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized to delete this review");
  }

  await review.deleteOne();
  await recalcCourseRating(review.course);
  logInfo(`Review deleted: ${id}`);
  return true;
};
