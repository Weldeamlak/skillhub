import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    tx_ref: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["subscription", "one-time"], required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    splitAmount: { type: Number, default: 0 },
    platformShare: { type: Number, default: 0 },
    instructorShare: { type: Number, default: 0 },
    gatewayFeeEstimate: { type: Number, default: 0 },
    payoutCredited: { type: Boolean, default: false },
    payoutStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    payoutPaidAt: { type: Date },
    payoutTxRef: { type: String },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
