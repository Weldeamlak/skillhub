import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

export const registerService = async ({ username, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  // ✅ Do NOT hash here — the User pre-save hook handles hashing automatically.
  // Double-hashing would make login always fail.
  const user = new User({ username, email, password, role });
  
  // ✅ Email Verification Logic
  const verificationToken = user.createEmailVerificationToken();
  await user.save();

  const verificationURL = `${env.APP_BASE_URL}/verify-email/${verificationToken}`; // Adjust frontend URL as needed
  const message = `Welcome to SkillHub! Please verify your email address by submitting a PATCH request to: \n${verificationURL}`;

  // --- TEMP BYPASS FOR LOCAL TESTING (OPTION B) ---
  // We are skipping the actual email send and returning the token directly.
  return { 
    message: "Registration successful. Email sending bypassed for testing. Use this token below for the verify-email endpoint.", 
    verificationToken: verificationToken 
  };
  
  /*
  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your email address",
      message,
    });
    return { message: "Registration successful. Please check your email to verify your account." };
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("There was an error sending the verification email. Try again later!");
  }
  */
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
  const resetURL = `${env.APP_BASE_URL}/reset-password/${resetToken}`; // Adjust frontend URL as needed

  const message = `Forgot your password? Submit a PATCH request with your new password to: \n${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // --- TEMP BYPASS FOR LOCAL TESTING (OPTION B) ---
  // We are skipping the actual email send and returning the token to you directly.
  // In production, uncomment the try/catch block below and remove the return statement here.
  
  return { 
    message: "Email sending bypassed for testing. Use this token below for the reset endpoint.", 
    resetToken: resetToken 
  };

  /*
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
    return { message: "Token sent to email!" };
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new Error("There was an error sending the email. Try again later!");
  }
  */
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
