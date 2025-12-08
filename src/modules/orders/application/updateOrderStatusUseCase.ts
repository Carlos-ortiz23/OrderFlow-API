import { OrderRepository } from "../domain/orderRepositoryInterface";
import { logger } from "../../../utils/logger";

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(orderId: string, status: string): Promise<boolean> {
    try {
      const validStatuses = ["pending", "confirmed", "shipped", "cancelled"];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      logger.info("Updating order status", { orderId, status });
      
      const updated = await this.orderRepo.updateOrderStatus(orderId, status);

      if (updated) {
        logger.info("Status updated successfully", { orderId, status });
      }

      return updated;
    } catch (error) {
      logger.error("Error in UpdateOrderStatusUseCase", { error, orderId, status });
      throw error;
    }
  }
}
