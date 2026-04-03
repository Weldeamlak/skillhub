import env from "../config/env.js";

// Centralized error-handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
