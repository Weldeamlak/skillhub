import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { addEmailJob } from "../config/queue.js";

export const registerService = async ({ username, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  // ✅ Do NOT hash here — the User pre-save hook handles hashing automatically.
  // Double-hashing would make login always fail.
  const user = new User({ username, email, password, role });
  
  // ✅ Email Verification Logic
  const verificationToken = user.createEmailVerificationToken();
  await user.save();

  const verificationURL = `${env.APP_BASE_URL}/api/v1/auth/verify-email/${verificationToken}`;

  // Add background email job
  await addEmailJob("verifyEmail", {
    to: user.email,
    username: user.username,
    verificationUrl: verificationURL,
  });

  return { message: "Registration successful. Please check your email to verify your account." };
};

export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (!user.isVerified) {
    throw new Error("Please verify your email address before logging in.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

export const logoutService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  user.refreshToken = null;
  await user.save();
  return true;
};

export const refreshService = async (token) => {
  if (!token) throw new Error("Refresh token is required");
  
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  
  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid refresh token");
  }
  
  const accessToken = generateAccessToken(user);
  return { accessToken };
};

export const forgotPasswordService = async (email) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("There is no user with that email address.");
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  const resetURL = `${env.APP_BASE_URL}/api/v1/auth/reset-password/${resetToken}`;

  // Add background email job
  await addEmailJob("forgotPassword", {
    to: user.email,
    username: user.username,
    resetUrl: resetURL,
  });

  return { message: "Token sent to email!" };
};

export const resetPasswordService = async (token, newPassword) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is user, set the new password
  if (!user) {
    throw new Error("Token is invalid or has expired");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Log the user in, send JWT
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

export const verifyEmailService = async (token) => {
  // 1. Get user based on the hashed token
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  // 2. If token hasn't expired and user exists, set isVerified = true
  if (!user) {
    throw new Error("Verification token is invalid or has expired");
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  
  await user.save();

  return { message: "Email successfully verified. You can now log in." };
};
