import { Request, Response } from "express";
import { ProcessMessageUseCase } from "../application/processMessageUseCase";
import { TelegramWebhookValidator } from "./dtos/telegramWebhookDto";
import { logger } from "../../../utils/logger";

export class BotController {
  constructor(private readonly processMessageUseCase: ProcessMessageUseCase) {}

  /**
   * @swagger
   * /api/bot/webhook:
   *   post:
   *     summary: Telegram bot webhook endpoint
   *     description: Receives and processes messages from Telegram bot. Ignores commands like /start. Rate limited to 30 requests per minute per IP.
   *     tags: [Bot]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TelegramWebhook'
   *           example:
   *             update_id: 123456789
   *             message:
   *               message_id: 1
   *               from:
   *                 id: 987654321
   *                 first_name: John
   *               chat:
   *                 id: 987654321
   *                 type: private
   *               text: I want to buy coffee
   *     responses:
   *       200:
   *         description: Webhook received and accepted for processing
   *       400:
   *         description: Invalid webhook data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: Invalid webhook data
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: Too many requests
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  public receiveWebhook = async (req: Request, res: Response) => {
    try {
      const update = req.body;

      // Validate that the webhook is valid
      if (!TelegramWebhookValidator.isValidUpdate(update)) {
        logger.warn("Invalid webhook received", { update });
        return res.status(400).json({ error: "Invalid webhook data" });
      }

      // Respond OK to Telegram immediately to avoid retries
      res.sendStatus(200);

      // Validate that it's a text message
      if (!TelegramWebhookValidator.isTextMessage(update)) {
        logger.debug("Message is not text, ignoring");
        return;
      }

      // Extract message data
      const messageData = TelegramWebhookValidator.extractMessageData(update);
      if (!messageData) {
        logger.warn("Could not extract message data");
        return;
      }

      const { chatId, text, senderName } = messageData;

      // Ignore Telegram commands (e.g., /start, /help)
      if (text.startsWith('/')) {
        logger.debug("Ignoring Telegram command", { command: text, chatId });
        return;
      }

      // Execute logic without blocking the HTTP response
      this.processMessageUseCase
        .run(text, chatId, senderName)
        .catch((err) => logger.error("Async error processing message", err));
    } catch (error: any) {
      logger.error("Error in webhook", error);
      if (!res.headersSent) res.sendStatus(500);
    }
  };
}
