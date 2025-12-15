import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/authMiddleware";
import { BotFatherService } from "./telegram/botFatherService";
import { StoreRepository } from "../../stores/domain/storeRepositoryInterface";
import { logger } from "../../../utils/logger";
import { z } from "zod";

// Zod schema for request validation
const createStoreBotSchema = z.object({
  storeName: z.string().min(3).max(255),
  storeId: z.string().uuid(),
  proposedUsername: z.string().min(3).max(60).optional(),
});

export class BotCreationController {
  private botFatherService: BotFatherService;

  constructor(private readonly storeRepo: StoreRepository) {
    this.botFatherService = new BotFatherService();
  }

  /**
   * Create a new Telegram bot for a store and set up its webhook
   */
  createStoreBot = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }

      // Validate request body
      const validationResult = createStoreBotSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validationResult.error.format()
        });
        return;
      }

      const { storeName, storeId, proposedUsername } = validationResult.data;

      // Verify store ownership
      const isOwner = await this.storeRepo.isStoreOwner(storeId, req.user.userId);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to create a bot for this store"
        });
        return;
      }

      // Check if store already has a bot token
      const store = await this.storeRepo.getStoreById(storeId);
      if (!store) {
        res.status(404).json({ success: false, message: "Store not found" });
        return;
      }

      if (store.telegram_bot_token) {
        res.status(409).json({
          success: false,
          message: "This store already has a Telegram bot"
        });
        return;
      }

      try {
        // Create the bot via BotFather
        const botInfo = await this.botFatherService.createBot(storeName, proposedUsername);

        // Set up the webhook
        const webhookSuccess = await this.botFatherService.setWebhook(botInfo.token, storeId);
        if (!webhookSuccess) {
          logger.warn("Failed to set webhook for new bot", { storeId, botUsername: botInfo.username });
        }
        
        // Update the store with the new bot token
        await this.storeRepo.updateStore(storeId, { telegram_bot_token: botInfo.token });

        // Return success response
        res.status(201).json({
          success: true,
          message: "Bot created and configured successfully",
          data: {
            token: botInfo.token,
            botUsername: botInfo.username,
            botId: botInfo.botId,
            webhookConfigured: webhookSuccess
          }
        });
      } catch (error) {
        // Verificar si el error es por falta de credenciales
        if (error instanceof Error && 
            (error.message.includes('API ID or Hash not provided') || 
             error.message.includes('Telegram client not initialized'))) {
          res.status(503).json({
            success: false,
            message: "Telegram bot creation service is not available. Please contact the administrator.",
            details: "Missing Telegram API credentials"
          });
          return;
        }
        
        // Reenviar otros errores al manejador general
        throw error;
      }
    } catch (error) {
      logger.error("Error creating store bot", { error, storeId: req.body.storeId });
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('username already taken')) {
          res.status(400).json({ 
            success: false, 
            message: "Could not create bot with the provided name, username already taken" 
          });
          return;
        }
      }
      
      res.status(500).json({ success: false, message: "Error creating store bot" });
    }
  };
}
