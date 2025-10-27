import Promotion from "../model/Promotion.js";
import { logInfo, logError } from "../logs/logger.js";

export const createPromotionService = async (data) => {
  try {
    const { code, discountType, discountValue, validFrom, validTo, isActive } =
      data;

    const existing = await Promotion.findOne({
      code: code.trim().toUpperCase(),
    });
    if (existing) throw new Error("Promotion code already exists");

    const promo = new Promotion({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      validFrom,
      validTo,
      isActive: !!isActive,
    });

    const saved = await promo.save();
    logInfo(`Promotion created: ${saved.code}`);
    return saved;
  } catch (error) {
    logError(`Error creating promotion: ${error.message}`);
    throw error;
  }
};

export const getPromotionsService = async ({
  page = 1,
  limit = 10,
  active,
} = {}) => {
  const skip = (page - 1) * limit;
  const filter = {};
  if (active !== undefined)
    filter.isActive = active === "true" || active === true;

  const [items, total] = await Promise.all([
    Promotion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Promotion.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPromotionByIdService = async (id) => {
  const promo = await Promotion.findById(id);
  if (!promo) throw new Error("Promotion not found");
  return promo;
};

export const updatePromotionService = async (id, updateData) => {
  const promo = await Promotion.findById(id);
  if (!promo) throw new Error("Promotion not found");

  Object.assign(promo, updateData);
  if (updateData.code) promo.code = updateData.code.trim().toUpperCase();

  const saved = await promo.save();
  logInfo(`Promotion updated: ${saved.code}`);
  return saved;
};

export const deletePromotionService = async (id) => {
  const promo = await Promotion.findByIdAndDelete(id);
  if (!promo) throw new Error("Promotion not found");
  logInfo(`Promotion deleted: ${promo.code}`);
  return true;
};
