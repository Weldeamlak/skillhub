import { requestWithdrawalService, handlePayoutActionService, getPayoutHistoryService } from "../services/payoutService.js";
import { logError } from "../logs/logger.js";

/**
 * Handle withdrawal request from instructor
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const payout = await requestWithdrawalService(req.user._id, req.body);
    res.status(201).json({ message: "Withdrawal request submitted", payout });
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Admin: Approve/Reject a payout
 */
export const processPayout = async (req, res) => {
  try {
    const { payoutId, action, notes } = req.body;
    if (!payoutId || !action) {
      return res.status(400).json({ message: "payoutId and action are required" });
    }

    const { _id: adminId } = req.user;
    const result = await handlePayoutActionService(payoutId, adminId, action, notes);
    res.status(200).json({ message: `Payout ${result.status} successfully`, result });
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * View payout history for instructor or global admin queue
 */
export const getPayoutHistory = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "instructor") {
      filter = { instructor: req.user._id };
    }
    const history = await getPayoutHistoryService(filter);
    res.status(200).json(history);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};
