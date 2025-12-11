import { Router } from "express";
import { OrderController } from "./infrastructure/orderController";
import { SupabaseOrderRepository } from "./infrastructure/database/supabaseOrderRepository";
import { CreateOrderUseCase } from "./application/createOrderUseCase";
import { UpdateOrderStatusUseCase } from "./application/updateOrderStatusUseCase";
import { NotifyCustomerUseCase } from "./application/notifyCustomerUseCase";
import { TelegramProvider } from "../bot/infrastructure/telegram/telegramProvider";
import { validateRequest } from "../../middlewares/validateRequest";
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

router.get("/", validateRequest(getOrdersSchema), controller.getOrders);
router.get("/stats", controller.getStats);
router.get("/:id", validateRequest(getOrderByIdSchema), controller.getOrderById);
router.patch("/:id/status", validateRequest(updateOrderStatusSchema), controller.updateOrderStatus);

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
