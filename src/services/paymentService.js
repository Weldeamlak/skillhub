import Payment from "../model/Payment.js";
import Course from "../model/Course.js";
import Enrollment from "../model/Enrollement.js";
import mongoose from "mongoose";
import { logInfo, logError } from "../logs/logger.js";

const CHAPA_BASE = process.env.CHAPA_BASE_URL || "https://api.chapa.co";
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
const CHAPA_PUBLIC = process.env.CHAPA_PUBLIC_KEY;

export const createPaymentService = async (paymentData, user) => {
  try {
    const { course, tx_ref, amount, type } = paymentData;

    if (course) {
      const existingCourse = await Course.findById(course);
      if (!existingCourse) throw new Error("Course not found");
    }

    // optionally ensure tx_ref uniqueness
    const existing = await Payment.findOne({ tx_ref });
    if (existing) throw new Error("Transaction reference already exists");

    const newPayment = new Payment({
      user: user._id,
      course,
      tx_ref,
      amount,
      type,
    });

    const saved = await newPayment.save();
    logInfo(`Payment created: ${saved._id}`);
    return saved;
  } catch (error) {
    logError(`Error creating payment: ${error.message}`);
    throw error;
  }
};

// Initialize a Chapa transaction and return checkout url
export const initiateChapaTransaction = async (
  paymentData,
  user,
  callbackUrl
) => {
  try {
    const { course, amount, type } = paymentData;

    if (course) {
      const existingCourse = await Course.findById(course);
      if (!existingCourse) throw new Error("Course not found");
    }

    // generate tx_ref if not provided
    const tx_ref = `chapa_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // create pending payment record
    const newPayment = new Payment({
      user: user._id,
      course,
      tx_ref,
      amount,
      type,
      status: "pending",
    });
    const saved = await newPayment.save();

    if (!CHAPA_SECRET) throw new Error("Chapa secret key not configured");

    const payload = {
      amount: Number(amount),
      currency: "ETB",
      email: user.email,
      first_name: user.username || "",
      tx_ref,
      callback_url: callbackUrl,
    };

    const res = await fetch(`${CHAPA_BASE}/v1/transaction/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHAPA_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data?.data) {
      logError(`Chapa init failed: ${JSON.stringify(data)}`);
      throw new Error(data?.message || "Chapa initialization failed");
    }

    return {
      payment: saved,
      checkout_url: data.data.checkout_url,
      chapa_data: data.data,
      chapa_public_key: CHAPA_PUBLIC || null,
    };
  } catch (error) {
    logError(`Error initiating chapa transaction: ${error.message}`);
    throw error;
  }
};

// Verify chapa transaction and finalize payment/enrollment
export const verifyChapaTransaction = async (tx_ref) => {
  try {
    if (!CHAPA_SECRET) throw new Error("Chapa secret key not configured");

    const res = await fetch(`${CHAPA_BASE}/v1/transaction/verify/${tx_ref}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${CHAPA_SECRET}` },
    });

    const data = await res.json();
    if (!res.ok || !data?.data) {
      logError(`Chapa verify failed: ${JSON.stringify(data)}`);
      throw new Error(data?.message || "Chapa verification failed");
    }

    const chapaStatus = data.data.status; // expected 'success'

    let payment = await Payment.findOne({ tx_ref });
    if (!payment) throw new Error("Payment record not found");

    if (chapaStatus === "success") {
      // compute split: platform 20%, instructor 80%
      const PLATFORM_PCT = 0.2;

      // Use a transaction to atomically update payment, create enrollment and credit instructor.
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // reload payment doc in the session to get latest
          const paymentDoc = await Payment.findOne({ tx_ref }).session(session);
          if (!paymentDoc)
            throw new Error("Payment record not found in transaction");

          const gross = Number(paymentDoc.amount || data.data.amount || 0);
          const gatewayFee = 0; // placeholder if you later parse actual fee
          const netForSplit = Math.round(gross - gatewayFee);
          const platformShare = Math.round(netForSplit * PLATFORM_PCT);
          const instructorShare = netForSplit - platformShare;

          paymentDoc.status = "success";
          paymentDoc.platformShare = platformShare;
          paymentDoc.instructorShare = instructorShare;
          paymentDoc.gatewayFeeEstimate = gatewayFee;

          // create enrollment if course present (and not exists)
          if (paymentDoc.course) {
            const existing = await Enrollment.findOne({
              course: paymentDoc.course,
              student: paymentDoc.user,
            }).session(session);

            if (!existing) {
              await Enrollment.create(
                [{ course: paymentDoc.course, student: paymentDoc.user }],
                { session }
              );
              await Course.findByIdAndUpdate(
                paymentDoc.course,
                { $addToSet: { students: paymentDoc.user } },
                { session }
              );
            }

            // credit instructor earnings only once
            if (!paymentDoc.payoutCredited) {
              const courseDoc = await Course.findById(
                paymentDoc.course
              ).session(session);
              const instructorId = courseDoc?.instructor;
              if (instructorId) {
                const User = (await import("../model/User.js")).default;
                await User.findByIdAndUpdate(
                  instructorId,
                  { $inc: { earnings: instructorShare } },
                  { session }
                );
                paymentDoc.payoutCredited = true;
                paymentDoc.payoutStatus = "pending";
              }
            }
          }

          await paymentDoc.save({ session });
        });
      } finally {
        session.endSession();
      }

      // reload updated payment to return latest fields
      payment = await Payment.findOne({ tx_ref });
    } else {
      payment.status = chapaStatus || "failed";
      await payment.save();
    }

    return { chapa: data.data, payment };
  } catch (error) {
    logError(`Error verifying chapa transaction: ${error.message}`);
    throw error;
  }
};

export const getAllPaymentsService = async () => {
  return await Payment.find()
    .populate("user", "username email")
    .populate("course", "title");
};

export const getPaymentsByUserService = async (userId) => {
  return await Payment.find({ user: userId }).populate("course", "title");
};

export const getPaymentByIdService = async (id) => {
  const payment = await Payment.findById(id)
    .populate("user", "username email")
    .populate("course", "title");
  if (!payment) throw new Error("Payment not found");
  return payment;
};

export const updatePaymentService = async (id, updateData, user) => {
  try {
    const payment = await Payment.findById(id);
    if (!payment) throw new Error("Payment not found");

    // only payment owner or admin can update
    if (
      payment.user.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new Error("Not authorized to update this payment");
    }

    Object.assign(payment, updateData);
    const updated = await payment.save();
    logInfo(`Payment updated: ${updated._id}`);
    return updated;
  } catch (error) {
    logError(`Error updating payment: ${error.message}`);
    throw error;
  }
};

export const deletePaymentService = async (id, user) => {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error("Payment not found");

  if (
    payment.user.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized to delete this payment");
  }

  await payment.deleteOne();
  logInfo(`Payment deleted: ${id}`);
  return true;
};

export const getUnpaidPayoutsService = async () => {
  return await Payment.find({
    payoutCredited: true,
    payoutStatus: { $ne: "paid" },
  }).populate("course user");
};

export const markPaymentPaidService = async (id, payoutTxRef) => {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error("Payment not found");
  payment.payoutStatus = "paid";
  payment.payoutPaidAt = new Date();
  if (payoutTxRef) payment.payoutTxRef = payoutTxRef;
  await payment.save();
  return payment;
};
