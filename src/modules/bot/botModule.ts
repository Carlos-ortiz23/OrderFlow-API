import { Router } from "express";
import { BotController } from "./infrastructure/botController";
import { BotCreationController } from "./infrastructure/botCreationController";
import { ProcessMessageUseCase } from "./application/processMessageUseCase";
import { TelegramProvider } from "./infrastructure/telegram/telegramProvider";
import { LLMProvider } from "./infrastructure/llm/llmProvider";
import { SupabaseChatHistoryRepository } from "./infrastructure/database/supabaseChatHistoryRepository";
import { webhookRateLimiter } from "../../middlewares/rateLimiter";
import { ProductModule } from "../products/productModule";
import { OrderModule } from "../orders/orderModule";
import { ClientModule } from "../clients/clientModule";
import { StoreModule } from "../stores/storeModule";
import { authMiddleware } from "../../middlewares/authMiddleware";

// 1. Get repositories from products and orders modules
const productRepo = ProductModule.productRepository;
const createOrderUseCase = OrderModule.createOrderUseCase;
const clientService = ClientModule.clientService;

// 2. Instantiate chat history repository (belongs to bot)
const chatHistoryRepo = new SupabaseChatHistoryRepository();

// 3. Instantiate external services
const telegramProvider = new TelegramProvider();

// 4. Instantiate the AI Agent (Injecting repositories for it to use as Tools)
const aiAgent = new LLMProvider(productRepo, createOrderUseCase);

// 5. Instantiate the Use Case (Injecting Telegram, the Agent and the History Repository)
const useCase = new ProcessMessageUseCase(telegramProvider, aiAgent, chatHistoryRepo);

// 6. Instantiate Controllers and Routes
const controller = new BotController(useCase, clientService);
const storeRepo = StoreModule.storeRepository;

const router = Router();

// Apply rate limiting to the webhook
router.post("/webhook/:storeId", webhookRateLimiter, controller.receiveWebhook);

// Bot creation endpoint - inicializar el controlador solo cuando se necesite
router.post("/create", authMiddleware, (req, res) => {
  // Crear el controlador bajo demanda para evitar inicialización temprana
  const botCreationController = new BotCreationController(storeRepo);
  return botCreationController.createStoreBot(req, res);
});

export class BotModule {
  static get routes(): Router {
    return router;
  }
}
