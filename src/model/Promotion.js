import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ], // ✅ Fix #18: If empty, it's a global promo. Otherwise, only for these courses.
  },
  { timestamps: true }
);

// Faster lookups for validating promo codes
const Promotion = mongoose.model("Promotion", PromotionSchema);
export default Promotion;
