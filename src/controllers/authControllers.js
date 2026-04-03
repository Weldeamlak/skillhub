import { registerService, loginService, logoutService, refreshService, forgotPasswordService, resetPasswordService, verifyEmailService } from "../services/authService.js";
import { validationResult } from "express-validator";

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const response = await registerService(req.body);
    // Registration now requires email verification, so we don't immediately get tokens
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user, accessToken, refreshToken } = await loginService(req.body);
    res.status(200).json({ message: "Login successful", user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await logoutService(req.user._id);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { accessToken } = await refreshService(req.body.token);
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }
    const response = await forgotPasswordService(email);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Please provide a new password" });
    }
    const { user, accessToken, refreshToken } = await resetPasswordService(token, password);
    res.status(200).json({ message: "Password reset successful", user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const response = await verifyEmailService(token);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
