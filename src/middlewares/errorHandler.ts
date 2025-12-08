import { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/env.config";
import { logger } from "../utils/logger";

/**
 * Custom class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global middleware for error handling
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If it's an AppError, use its statusCode, otherwise 500
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log the error
  logger.error("Error caught in request", err, {
    statusCode,
    path: req.path,
    method: req.method,
  });

  // In production, don't expose internal details
  const message = envConfig.isProduction() && !isOperational
    ? "Internal server error"
    : err.message;

  // Respond to the client
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(envConfig.isDevelopment() && { stack: err.stack }),
  });
};

/**
 * Middleware for not found routes (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Wrapper for async functions in routes
 * Automatically catches errors without needing try-catch
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
