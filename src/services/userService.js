// src/services/userService.js
import User from "../model/User.js";
import bcrypt from "bcryptjs";

export const createUserService = async ({
  username,
  email,
  password,
  role,
}) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  // ✅ Do NOT hash here — the User pre-save hook handles hashing automatically.
  const user = new User({ username, email, password, role });
  await user.save();

  const { password: _pw, ...safeUser } = user.toObject();
  return safeUser;
};

export const getAllUsersService = async ({
  filter = {},
  options = null,
} = {}) => {
  // If no options provided, return full list (legacy behavior)
  if (!options) {
    const users = await User.find(filter).select("-password");
    if (!users || users.length === 0) throw new Error("No users found");
    return users;
  }

  const total = await User.countDocuments(filter);
  // ✅ Fix #25: Only one .select() call — build field selection properly
  const selectFields = options.select
    ? `-password ${options.select}`
    : "-password";
  const users = await User.find(filter)
    .select(selectFields)
    .sort(options.sort || undefined)
    .skip(options.skip)
    .limit(options.limit);

  return {
    items: users,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getUserByIdService = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserService = async (id, updateData, currentUser) => {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");

  if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
    throw new Error("Forbidden: Access denied");
  }

  if (currentUser.role !== "admin") {
    delete updateData.role;
    delete updateData.earnings;
  }

  Object.assign(user, updateData);

  if (updateData.password) {
    // Pre-save hook will re-hash; set plain text and let hook run
    user.password = updateData.password;
  }

  await user.save();
  // ✅ Don't leak the password hash
  const { password: _pw, ...safeUser } = user.toObject();
  return safeUser;
};

export const deleteUserService = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return user;
};
