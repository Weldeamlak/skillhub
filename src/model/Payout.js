import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [50, "Minimum payout is $50"], // Example threshold
  },
  status: {
    type: String,
    enum: ["pending", "processing", "paid", "rejected"],
    default: "pending",
  },
  method: {
    type: String,
    required: true,
    enum: ["telebirr", "chapa", "bank", "paypal"],
  },
  paymentDetails: {
    accountNumber: String,
    bankName: String,
    phoneNumber: String,
  },
  adminNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedAt: Date,
  payoutRef: String,
}, {
  timestamps: true,
});

// Index for admin dashboard performance
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ instructor: 1 });

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
