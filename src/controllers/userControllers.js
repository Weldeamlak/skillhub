import {
  createUserService,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "../services/userService.js";
import { logInfo, logError } from "../logs/logger.js";
import { validationResult } from "express-validator";

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await createUserService(req.body);
    logInfo(`User created: ${user.email}`);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    logError(error.message);
    res.status(400).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await updateUserService(req.params.id, req.body, req.user);
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await deleteUserService(req.params.id);
    res.status(200).json({ message: "User deleted successfully", user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
