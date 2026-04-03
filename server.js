import express from "express";
import env from "./src/config/env.js";
import cors from "cors";
import helmet from "helmet";                          // ✅ Fix #20: security headers
import mongoSanitize from "express-mongo-sanitize";   // ✅ Fix #24: NoSQL injection protection
import xss from "xss-clean";                           // ✅ Add XSS protection
import connectDB from "./src/config/database.js";
import { connectRedis } from "./src/config/redis.js";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import courseRoutes from "./src/routes/courseRoutes.js";
import lessonRoutes from "./src/routes/lessonRoutes.js";
import enrollmentRoutes from "./src/routes/enrollmentRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import promotionRoutes from "./src/routes/promotionRoutes.js";
import progressionRoutes from "./src/routes/progressionRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import payoutRoutes from "./src/routes/payoutRoutes.js";
import rateLimitMiddleware from "./src/middleware/rateLimitMiddleware.js";
import { initQueue } from "./src/config/queue.js";
import { startWorker } from "./src/services/worker.js"; 
import errorHandler from "./src/middleware/errorMiddleware.js";  // ✅ Fix #12

const app = express();

// ──────────────────────────────────────────
// Security middleware (before everything else)
// ──────────────────────────────────────────

// ✅ Fix #20: Helmet sets X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.
app.use(helmet());

// ✅ Fix #10: Restrict CORS to explicit allowed origins in production
const allowedOrigins = (env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ✅ Fix #21: Explicit 10kb body limit — prevents JSON payload flooding
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ✅ Fix #24: Strip $ and . from user-supplied keys to prevent MongoDB operator injection
// Express 5 Compatibility Shim: Make req.query writable for legacy sanitizers
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', { value: req.query, writable: true, configurable: true });
  next();
});
app.use(mongoSanitize());
app.use(xss()); // ✅ Prevent XSS in user strings

// Normalize incoming URL paths: trim spaces and decode %20 to prevent accidental invalid routes
app.use((req, res, next) => {
  try {
    if (req.url && (req.url.includes("%20") || req.url.endsWith(" "))) {
      const decoded = decodeURIComponent(req.url).trim();
      req.url = decoded;
    }
  } catch (e) {
    // ignore decode errors
  }
  next();
});

// ──────────────────────────────────────────
// Connections & Bootstrap
// ──────────────────────────────────────────

const startPlatform = async () => {
  // 1. Redis Check (Optional)
  const redisAvailable = await connectRedis();
  if (redisAvailable) {
    initQueue();
    startWorker();
  }
  
  // 2. MongoDB Connect (Required)
  await connectDB();

  // 3. Start Express Server
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${env.NODE_ENV || "development"} mode`);
    console.log(`[Status] Primary features are ACTIVE.`);
    if (!redisAvailable) {
      console.log(`[Status] Running in Safe Mode (Redis offline — Queue/Cache disabled)`);
    }
  });
};

app.use(rateLimitMiddleware);

// ──────────────────────────────────────────
// Routes — API base path (versioned)
// ──────────────────────────────────────────
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/lessons", lessonRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/promotions", promotionRoutes);
app.use("/api/v1/progression", progressionRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/payouts", payoutRoutes);

// Health check (exempt from rate limiting via RATE_LIMIT_EXEMPT=/health)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root info
app.get("/", (req, res) => {
  res.json({ name: "SkillHub API", version: "1.0.0", status: "running" });
});

// ✅ Fix #23: Catch-all 404 for undefined routes — returns JSON, not HTML
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ✅ Fix #12: Register centralized error handler LAST (was defined but never used)
app.use(errorHandler);

// ──────────────────────────────────────────
// Start server
// ──────────────────────────────────────────
startPlatform().catch((error) => {
  console.error("[Server] Startup failed:", error);
  process.exit(1);
});

