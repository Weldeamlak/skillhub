import {
  createPaymentService,
  getAllPaymentsService,
  getPaymentsByUserService,
  getPaymentByIdService,
  updatePaymentService,
  deletePaymentService,
  initiateChapaTransaction,
  verifyChapaTransaction,
} from "../services/paymentService.js";
import { logInfo, logError } from "../logs/logger.js";
import { validationResult } from "express-validator";

export const createPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const payment = await createPaymentService(req.body, req.user);
    logInfo(`Payment created for user ${req.user.email}`);
    res.status(201).json(payment);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

import {
  getUnpaidPayoutsService,
  markPaymentPaidService,
} from "../services/paymentService.js";
// Initialize Chapa and return checkout url
export const initChapa = async (req, res) => {
  try {
    const callbackUrl =
      req.body.callbackUrl ||
      `${process.env.APP_BASE_URL}/api/payments/chapa-callback`;
    const result = await initiateChapaTransaction(
      req.body,
      req.user,
      callbackUrl
    );
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

// Webhook or manual verify endpoint
export const chapaVerify = async (req, res) => {
  try {
    const tx_ref = req.query.tx_ref || req.body.tx_ref;
    if (!tx_ref) return res.status(400).json({ message: "tx_ref is required" });
    const result = await verifyChapaTransaction(tx_ref);
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await getAllPaymentsService();
    res.status(200).json(payments);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await getPaymentsByUserService(req.user._id);
    res.status(200).json(payments);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await getPaymentByIdService(req.params.id);
    res.status(200).json(payment);
  } catch (error) {
    logError(error.message);
    res.status(404).json({ message: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const updated = await updatePaymentService(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json(updated);
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    await deletePaymentService(req.params.id, req.user);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    logError(error.message);
    res.status(403).json({ message: error.message });
  }
};

export const getUnpaidPayouts = async (req, res) => {
  try {
    const items = await getUnpaidPayoutsService();
    res.status(200).json(items);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const markPaymentPaid = async (req, res) => {
  try {
    const payoutTxRef = req.body.payoutTxRef;
    const updated = await markPaymentPaidService(req.params.id, payoutTxRef);
    res.status(200).json(updated);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};
