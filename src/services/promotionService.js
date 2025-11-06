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
  filter = {},
  options = null,
} = {}) => {
  if (!options) {
    const items = await Promotion.find(filter).sort({ createdAt: -1 });
    return {
      items,
      pagination: {
        total: items.length,
        page: 1,
        limit: items.length,
        pages: 1,
      },
    };
  }

  const total = await Promotion.countDocuments(filter);
  const items = await Promotion.find(filter)
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit)
    .select(options.select || undefined);

  return {
    items,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
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
