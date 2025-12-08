import { OrderRepository } from "../domain/orderRepositoryInterface";
import { Order } from "../domain/orderInterface";
import { logger } from "../../../utils/logger";

export class CreateOrderUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(order: Order): Promise<string> {
    try {
      logger.info("Creating order", { 
        userId: order.userId, 
        itemCount: order.items.length,
        total: order.total 
      });

      const orderId = await this.orderRepo.createOrder(order);

      logger.info("Order created successfully", { orderId, userId: order.userId });
      return orderId;
    } catch (error) {
      logger.error("Error in CreateOrderUseCase", { error, userId: order.userId });
      throw error;
    }
  }
}
