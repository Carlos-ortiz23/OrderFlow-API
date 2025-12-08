import { envConfig } from "../config/env.config";

/**
 * Available log levels
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Colors for the console
 */
const colors = {
  DEBUG: "\x1b[36m", // Cyan
  INFO: "\x1b[32m", // Green
  WARN: "\x1b[33m", // Yellow
  ERROR: "\x1b[31m", // Red
  RESET: "\x1b[0m",
};

/**
 * Enhanced logger with levels and consistent format
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only show WARN and ERROR
    if (envConfig.isProduction()) {
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.RESET;

    let formatted = `${color}[${timestamp}] [${level}]${reset} ${message}`;

    if (meta) {
      formatted += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return formatted;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMeta = {
        ...meta,
        ...(error && {
          error: {
            message: error.message,
            stack: error.stack,
            ...error,
          },
        }),
      };
      console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
    }
  }

  /**
   * Specific log for HTTP requests
   */
  http(method: string, path: string, statusCode: number, duration?: number): void {
    const message = `${method} ${path} - ${statusCode}${
      duration ? ` (${duration}ms)` : ""
    }`;
    
    if (statusCode >= 500) {
      this.error(message);
    } else if (statusCode >= 400) {
      this.warn(message);
    } else {
      this.info(message);
    }
  }
}

// Export single instance (Singleton)
export const logger = new Logger();
