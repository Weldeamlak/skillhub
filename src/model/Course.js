import mongoose from "mongoose";
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    // ✅ Fix #17: Removed Course.students[] array — unbounded growth hits MongoDB 16MB doc limit.
    // Student list/count must be queried from the Enrollment collection instead.
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    metaTitle: String,
    metaDescription: String,
    promo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// High-performance search: weighting title hits over description matches
courseSchema.index({ title: "text", description: "text" }, { weights: { title: 10, description: 1 } });

// Index for fast instructor-based lookups
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1, status: 1 });

// Slug generation hook
courseSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
      
    // Handle potential collisions with a short random suffix if needed
    // In a mature system, you might check for existence first.
  }
  next();
});

const Course = mongoose.model("Course", courseSchema);
export default Course;

