import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  status: {
    type: String,
    enum: ["locked", "unlocked", "completed"],
    default: "locked",
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  quizScore: {
    type: Number,
    default: 0,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  assignmentSubmission: {
    projectLink: String,
    submittedAt: Date,
  },
}, {
  timestamps: true,
});

// Ensure a student only has one progress record per lesson
progressSchema.index({ user: 1, lesson: 1 }, { unique: true });
// Optimize course-level status checks
progressSchema.index({ user: 1, course: 1, status: 1 });

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;
