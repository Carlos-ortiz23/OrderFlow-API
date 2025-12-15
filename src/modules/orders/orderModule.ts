import { Router } from "express";
import { OrderController } from "./infrastructure/orderController";
import { SupabaseOrderRepository } from "./infrastructure/database/supabaseOrderRepository";
import { CreateOrderUseCase } from "./application/createOrderUseCase";
import { UpdateOrderStatusUseCase } from "./application/updateOrderStatusUseCase";
import { NotifyCustomerUseCase } from "./application/notifyCustomerUseCase";
import { TelegramProvider } from "../bot/infrastructure/telegram/telegramProvider";
import { validateRequest } from "../../middlewares/validateRequest";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { verifyStoreAccess } from "../../middlewares/storeAuthMiddleware";
import { telegramBotAuthMiddleware } from "../../middlewares/telegramBotAuthMiddleware";
import {
  getOrderByIdSchema,
  updateOrderStatusSchema,
  getOrdersSchema,
} from "./schemas/orderSchemas";

// Instantiate repository
const orderRepo = new SupabaseOrderRepository();

// Instantiate messaging provider for notifications
const messagingProvider = new TelegramProvider();

// Instantiate use cases
const createOrderUseCase = new CreateOrderUseCase(orderRepo);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepo);
const notifyCustomerUseCase = new NotifyCustomerUseCase(messagingProvider);

// Instantiate controller
const controller = new OrderController(
  orderRepo,
  updateOrderStatusUseCase,
  notifyCustomerUseCase
);

// Configure routes with validation
const router = Router();

// Protected routes - require authentication and store ownership verification
// Get all orders (with store_id filter)
router.get("/", 
  authMiddleware, 
  validateRequest(getOrdersSchema),
  verifyStoreAccess('store_id'),
  controller.getOrders
);

// Get order statistics
router.get("/stats", 
  authMiddleware,
  verifyStoreAccess('store_id'),
  controller.getStats
);

// Get order by ID
router.get("/:id", 
  authMiddleware,
  validateRequest(getOrderByIdSchema),
  verifyStoreAccess('store_id'),
  controller.getOrderById
);

// Get orders by store
router.get("/store/:storeId", 
  authMiddleware,
  verifyStoreAccess,
  controller.getOrdersByStore
);

// Update order status
router.patch("/:id/status", 
  authMiddleware,
  validateRequest(updateOrderStatusSchema),
  verifyStoreAccess('store_id'),
  controller.updateOrderStatus
);

// Bot routes - authenticated with bot token
// These routes are for the Telegram bot to access and create orders
const botRouter = Router();

// Bot webhook can create orders
botRouter.post("/bot/create", telegramBotAuthMiddleware, controller.createOrderFromBot);

// Bot can get order details
botRouter.get("/bot/:id", telegramBotAuthMiddleware, controller.getOrderById);

// Add bot routes to main router
router.use(botRouter);

export class OrderModule {
  static get routes(): Router {
    return router;
  }

  static get repository(): SupabaseOrderRepository {
    return orderRepo;
  }

  static get createOrderUseCase(): CreateOrderUseCase {
    return createOrderUseCase;
  }
}
