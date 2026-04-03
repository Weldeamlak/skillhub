// src/middleware/chapaWebhookMiddleware.js
// ✅ Security: Verifies Chapa webhook signature before processing payment callbacks.
// Chapa sends a hash in the "Chapa-Signature" header (SHA-256 HMAC of raw body).
// Without this check, any actor who knows the /chapa/verify URL can fake a payment.
import crypto from "crypto";
import env from "../config/env.js";

export const verifyChapaSignature = (req, res, next) => {
  // If no secret is configured, skip (dev mode) but log a warning
  const secret = env.CHAPA_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[WARN] CHAPA_WEBHOOK_SECRET not set — skipping webhook signature verification (not safe for production)"
    );
    return next();
  }

  const receivedSig =
    req.headers["chapa-signature"] || req.headers["x-chapa-signature"];
  if (!receivedSig) {
    return res.status(401).json({ message: "Missing Chapa-Signature header" });
  }

  // req.rawBody is populated by the global express.json() verify function — see server.js
  const rawBody = req.rawBody;
  if (!rawBody) {
    return res
      .status(400)
      .json({ message: "Raw body unavailable for signature verification" });
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(receivedSig, "utf8");
  const expectedBuffer = Buffer.from(expectedSig, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  next();
};
