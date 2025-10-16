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

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword, role });
  await user.save();

  return user;
};

export const getAllUsersService = async () => {
  const users = await User.find().select("-password");
  if (!users || users.length === 0) {
    throw new Error("No users found");
  }
  return users;
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
    user.password = await bcrypt.hash(updateData.password, 10);
  }

  await user.save();
  return user;
};

export const deleteUserService = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return user;
};
