import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateAccessToken = (user) => {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");

  return jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");

  return jwt.sign(
    { id: user._id },
    secret,
    { expiresIn: "7d" }
  );
};

