import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // MongoDB Cast Error
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  // Duplicate Key Error
  if (err.code === 11000) {
    message = "Duplicate field value";
    statusCode = 400;
  }

  // Validation Error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export default errorHandler;
