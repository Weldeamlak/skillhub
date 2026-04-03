import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

// ✅ Fix #15: DB-level unique constraint — one review per student per course
ReviewSchema.index({ student: 1, course: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);
export default Review;
