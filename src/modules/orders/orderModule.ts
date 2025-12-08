import { Router } from "express";
import { OrderController } from "./infrastructure/orderController";
import { SupabaseOrderRepository } from "./infrastructure/database/supabaseOrderRepository";
import { CreateOrderUseCase } from "./application/createOrderUseCase";
import { UpdateOrderStatusUseCase } from "./application/updateOrderStatusUseCase";

// Instantiate repository
const orderRepo = new SupabaseOrderRepository();

// Instantiate use cases
const createOrderUseCase = new CreateOrderUseCase(orderRepo);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepo);

// Instantiate controller
const controller = new OrderController(orderRepo, updateOrderStatusUseCase);

// Configure routes
const router = Router();

router.get("/", controller.getOrders);
router.get("/stats", controller.getStats);
router.get("/:id", controller.getOrderById);
router.patch("/:id/status", controller.updateOrderStatus);

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
