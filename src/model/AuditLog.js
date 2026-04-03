import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
    enum: ["User", "Course", "Lesson", "Payment", "Payout", "Promotion"],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Optimization for global audit dash
auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
