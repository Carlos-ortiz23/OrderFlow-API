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
   * @swagger
   * /health:
   *   get:
   *     summary: Basic health check
   *     description: Returns basic API health status and environment information
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is healthy and operational
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   *             example:
   *               status: OK
   *               service: OrderFlow API
   *               timestamp: 2024-12-10T22:00:00.000Z
   *               environment: development
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
   * @swagger
   * /health/detailed:
   *   get:
   *     summary: Detailed health check with external services verification
   *     description: Checks the health of all external services (Supabase, LLM, Telegram) and returns detailed status
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: All services are healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DetailedHealthCheck'
   *             example:
   *               status: OK
   *               service: OrderFlow API
   *               timestamp: 2024-12-10T22:00:00.000Z
   *               environment: development
   *               checks:
   *                 api:
   *                   status: OK
   *                   message: API is running
   *                 supabase:
   *                   status: OK
   *                   message: Supabase connection successful
   *                 llm:
   *                   status: OK
   *                   message: LLM API accessible
   *                 telegram:
   *                   status: OK
   *                   message: Telegram bot connected
   *       503:
   *         description: One or more services are degraded or unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DetailedHealthCheck'
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
      const llm = new OpenAI({ apiKey: envConfig.LLM_API_KEY, baseURL: envConfig.LLM_URL });

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
