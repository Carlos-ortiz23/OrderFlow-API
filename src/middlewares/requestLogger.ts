import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Middleware for HTTP request logging
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Capture when the response finishes
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(req.method, req.path, res.statusCode, duration);
  });

  next();
};
