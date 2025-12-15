import "dotenv/config";
import { logger } from "../utils/logger";

/**
 * Centralized environment variables configuration
 * Validates all required variables at application startup
 */
class EnvironmentConfig {
  // Server
  public readonly PORT: string;
  public readonly NODE_ENV: string;

  // Supabase
  public readonly SUPABASE_URL: string;
  public readonly SUPABASE_KEY: string;

  // OpenAI
  public readonly LLM_API_KEY: string;
  public readonly LLM_MODEL: string;
  public readonly LLM_URL: string;
  // Telegram
  public readonly TELEGRAM_BOT_TOKEN: string;
  
  // Authentication
  public readonly JWT_SECRET: string;
  public readonly JWT_ACCESS_TOKEN_EXPIRATION: string;
  public readonly JWT_REFRESH_TOKEN_EXPIRATION: string;
  public readonly BCRYPT_SALT_ROUNDS: number;

  constructor() {
    // Validate and assign environment variables
    this.PORT = process.env.PORT || "3000";
    this.NODE_ENV = process.env.NODE_ENV || "development";

    // Required variables
    this.SUPABASE_URL = this.getRequiredEnvVar("SUPABASE_URL");
    this.SUPABASE_KEY = this.getRequiredEnvVar("SUPABASE_KEY");
    this.LLM_API_KEY = this.getRequiredEnvVar("LLM_API_KEY");
    this.LLM_MODEL = this.getRequiredEnvVar("LLM_MODEL");
    this.LLM_URL = this.getRequiredEnvVar("LLM_URL");
    this.TELEGRAM_BOT_TOKEN = this.getRequiredEnvVar("TELEGRAM_BOT_TOKEN");
    this.JWT_SECRET = this.getRequiredEnvVar("JWT_SECRET");
    this.JWT_ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || "15m";
    this.JWT_REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION || "1h";
    this.BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  }

  /**
   * Gets a required environment variable or throws an error
   */
  private getRequiredEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Required environment variable not found: ${key}\n` +
          `Please configure ${key} in your .env file`
      );
    }
    return value;
  }

  /**
   * Checks if we are in production
   */
  public isProduction(): boolean {
    return this.NODE_ENV === "production";
  }

  /**
   * Checks if we are in development
   */
  public isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  }
}

// Export single instance (Singleton)
export const envConfig = new EnvironmentConfig();
