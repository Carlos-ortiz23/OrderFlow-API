import { Request, Response } from "express";
import { supabase } from "../../config/supabase";
import { envConfig } from "../../config/env.config";
import OpenAI from "openai";
import axios from "axios";

/**
 * Controller for health checks and service verification
 */
export class HealthController {
  /**
   * Basic health check 
   */
  static async basic(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: "OK",
      service: "OrderFlow API",
      timestamp: new Date().toISOString(),
      environment: envConfig.NODE_ENV,
    });
  }

  /**
   * Detailed health check with verification of external services
   */
  static async detailed(req: Request, res: Response): Promise<void> {
    const checks = {
      api: { status: "OK", message: "API is running" },
      supabase: await HealthController.checkSupabase(),
      openai: await HealthController.checkLLM(),
      telegram: await HealthController.checkTelegram(),
    };

    // Determine the general condition
    const allHealthy = Object.values(checks).every(
      (check) => check.status === "OK"
    );

    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: allHealthy ? "OK" : "DEGRADED",
      service: "OrderFlow API",
      timestamp: new Date().toISOString(),
      environment: envConfig.NODE_ENV,
      checks,
    });
  }

  /**
   * Verify the connection with Supabase
   */
  private static async checkSupabase(): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const { error } = await supabase.from("products").select("id").limit(1);

      if (error) {
        return {
          status: "ERROR",
          message: `Supabase error: ${error.message}`,
        };
      }

      return { status: "OK", message: "Supabase connection successful" };
    } catch (error: any) {
      return {
        status: "ERROR",
        message: `Supabase connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Verify the connection with LLM
   */
  private static async checkLLM(): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const llm = new OpenAI({ apiKey: envConfig.LLM_API_KEY });

      // Make a simple call to verify the API key
      await llm.models.list();

      return { status: "OK", message: "LLM API accessible" };
    } catch (error: any) {
      return {
        status: "ERROR",
        message: `LLM error: ${error.message}`,
      };
    }
  }

  /**
   * Verify the connection with Telegram
   */
  private static async checkTelegram(): Promise<{
    status: string;
    message: string;
  }> {
    try {
      const apiUrl = `https://api.telegram.org/bot${envConfig.TELEGRAM_BOT_TOKEN}/getMe`;
      const response = await axios.get(apiUrl, { timeout: 5000 });

      if (response.data.ok) {
        return {
          status: "OK",
          message: `Telegram bot connected: @${response.data.result.username}`,
        };
      }

      return {
        status: "ERROR",
        message: "Telegram API returned non-OK response",
      };
    } catch (error: any) {
      return {
        status: "ERROR",
        message: `Telegram connection failed: ${error.message}`,
      };
    }
  }
}
