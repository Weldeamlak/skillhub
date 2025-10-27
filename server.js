import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/database.js";
import { connectRedis } from "./src/config/redis.js";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import courseRoutes from "./src/routes/courseRoutes.js";
import lessonRoutes from "./src/routes/lessonRoutes.js";
import enrollementRoutes from "./src/routes/enrollementRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import promotionRoutes from "./src/routes/promotionRoutes.js";
import rateLimitMiddleware from "./src/middleware/rateLimitMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Redis (optional) and attach rate limiter
connectRedis();
app.use(rateLimitMiddleware);

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

// Connect MongoDB
connectDB();

// Routes — API base path
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promotions", promotionRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
