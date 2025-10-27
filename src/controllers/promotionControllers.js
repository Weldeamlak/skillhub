import {
  createPromotionService,
  getPromotionsService,
  getPromotionByIdService,
  updatePromotionService,
  deletePromotionService,
} from "../services/promotionService.js";
import { validationResult } from "express-validator";
import { logInfo, logError } from "../logs/logger.js";

export const createPromotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const promo = await createPromotionService(req.body);
    logInfo(`Promotion created: ${promo.code}`);
    res.status(201).json(promo);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getPromotions = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const active = req.query.active;
    const result = await getPromotionsService({ page, limit, active });
    res.status(200).json(result);
  } catch (error) {
    logError(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getPromotionById = async (req, res) => {
  try {
    const promo = await getPromotionByIdService(req.params.id);
    res.status(200).json(promo);
  } catch (error) {
    logError(error.message);
    res.status(404).json({ message: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const updated = await updatePromotionService(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    await deletePromotionService(req.params.id);
    res.status(200).json({ message: "Promotion deleted" });
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};
