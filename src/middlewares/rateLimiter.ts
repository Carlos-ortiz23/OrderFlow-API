import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Simple memory-based rate limiter
 * For production, consider using Redis with express-rate-limit
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 30) {
    this.windowMs = windowMs; // Time window in ms (default: 1 minute)
    this.maxRequests = maxRequests; // Maximum requests per window

    // Clean old requests every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Middleware to apply rate limiting
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const identifier = this.getIdentifier(req);
    const now = Date.now();

    // Get previous requests from the identifier
    let requestTimes = this.requests.get(identifier) || [];

    // Filter only requests within the time window
    requestTimes = requestTimes.filter((time) => now - time < this.windowMs);

    // Check if it exceeds the limit
    if (requestTimes.length >= this.maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`, {
        requests: requestTimes.length,
        limit: this.maxRequests,
      });

      res.status(429).json({
        error: "Too Many Requests",
        message: "You have exceeded the request limit. Please try again later.",
        retryAfter: Math.ceil(this.windowMs / 1000),
      });
      return;
    }

    // Add the current request
    requestTimes.push(now);
    this.requests.set(identifier, requestTimes);

    // Add informative headers
    res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      (this.maxRequests - requestTimes.length).toString()
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(now + this.windowMs).toISOString()
    );

    next();
  };

  /**
   * Gets a unique identifier for the client
   * Prioritizes real IP over proxy IP
   */
  private getIdentifier(req: Request): string {
    // Try to get the client's real IP
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? (forwarded as string).split(",")[0].trim()
      : req.socket.remoteAddress || "unknown";

    return ip;
  }

  /**
   * Cleans old requests from the map
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, times] of this.requests.entries()) {
      const validTimes = times.filter((time) => now - time < this.windowMs);

      if (validTimes.length === 0) {
        this.requests.delete(identifier);
        cleaned++;
      } else {
        this.requests.set(identifier, validTimes);
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: ${cleaned} identifiers removed`);
    }
  }
}

// Rate limiter for webhook (more restrictive)
export const webhookRateLimiter = new RateLimiter(60000, 30).middleware; // 30 requests per minute

// General rate limiter for other routes
export const generalRateLimiter = new RateLimiter(60000, 100).middleware; // 100 requests per minute
