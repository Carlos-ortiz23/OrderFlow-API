import { Request, Response } from "express";
import { ProcessMessageUseCase } from "../application/processMessageUseCase";
import { TelegramWebhookValidator } from "./dtos/telegramWebhookDto";
import { logger } from "../../../utils/logger";

export class BotController {
  constructor(private readonly processMessageUseCase: ProcessMessageUseCase) {}

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
