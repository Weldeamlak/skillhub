import Payout from "../model/Payout.js";
import User from "../model/User.js";
import AuditLog from "../model/AuditLog.js";
import { logInfo, logError } from "../logs/logger.js";
import mongoose from "mongoose";

/**
 * Instructor formally requests a withdrawal.
 * This is an atomic operation that reduces their 'earnings' and creates a 'payout' record.
 */
export const requestWithdrawalService = async (instructorId, payoutData) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { amount, method, paymentDetails } = payoutData;

    const user = await User.findById(instructorId).session(session);
    if (!user) throw new Error("Instructor not found");

    if (user.earnings < amount) {
      throw new Error("Insufficient balance for this payout request");
    }

    if (amount < 50) {
      throw new Error("Minimum payout amount is $50");
    }

    // 1. Reduce user's earnings
    user.earnings -= amount;
    await user.save({ session });

    // 2. Create payout request
    const newPayout = new Payout({
      instructor: instructorId,
      amount,
      method,
      paymentDetails,
      status: "pending",
    });
    const savedPayout = await newPayout.save({ session });

    // 3. Log the action
    await AuditLog.create([{
       actor: instructorId,
       action: "Payout Requested",
       resource: "Payout",
       resourceId: savedPayout._id,
       newData: { amount, status: "pending" },
    }], { session });

    await session.commitTransaction();
    logInfo(`Payout requested: ${savedPayout._id} for instructor ${instructorId}`);
    return savedPayout;
  } catch (error) {
    await session.abortTransaction();
    logError(`Payout request failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Admin handles (approves/rejects) a payout request.
 */
export const handlePayoutActionService = async (payoutId, adminId, action, notes = "") => {
  try {
    const payout = await Payout.findById(payoutId);
    if (!payout) throw new Error("Payout record not found");

    if (payout.status !== "pending") {
      throw new Error(`Cannot ${action} a payout that is already ${payout.status}`);
    }

    const previousStatus = payout.status;
    
    if (action === "approve") {
      payout.status = "paid";
      payout.processedAt = Date.now();
      payout.processedBy = adminId;
      payout.adminNotes = notes;
    } else if (action === "reject") {
      payout.status = "rejected";
      payout.processedAt = Date.now();
      payout.processedBy = adminId;
      payout.adminNotes = notes;

      // Re-credit the instructor if rejected
      await User.findByIdAndUpdate(payout.instructor, { $inc: { earnings: payout.amount } });
    } else {
      throw new Error("Invalid action for payout handling");
    }

    const updated = await payout.save();

    // Log the administrative action
    await AuditLog.create({
       actor: adminId,
       action: `Payout ${action === 'approve' ? 'Approved' : 'Rejected'}`,
       resource: "Payout",
       resourceId: payoutId,
       previousData: { status: previousStatus },
       newData: { status: updated.status, adminNotes: notes },
    });

    logInfo(`Payout ${updated.status}: ${payoutId}`);
    return updated;
  } catch (error) {
    logError(`Payout handling failed: ${error.message}`);
    throw error;
  }
};

/**
 * Histories for instructor/admin
 */
export const getPayoutHistoryService = async (filter = {}) => {
  return await Payout.find(filter)
    .populate("instructor", "username email avatar")
    .sort({ createdAt: -1 });
};
