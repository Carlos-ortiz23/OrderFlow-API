import { MessagingProvider } from "../../bot/domain/messagingProviderInterface";
import { logger } from "../../../utils/logger";

/**
 * Use Case: Notify customer about order status changes
 * Sends automated messages to customers via Telegram when order status changes
 */
export class NotifyCustomerUseCase {
  constructor(private readonly messagingProvider: MessagingProvider) {}

  async execute(userId: string, orderId: string, status: string): Promise<void> {
    const message = this.buildStatusMessage(orderId, status);
    
    try {
      await this.messagingProvider.sendMessage(userId, message);
      logger.info("Customer notification sent successfully", { userId, orderId, status });
    } catch (error) {
      logger.error("Failed to send customer notification", { error, userId, orderId, status });
      throw new Error("Failed to notify customer");
    }
  }

  /**
   * Build appropriate message based on order status
   */
  private buildStatusMessage(orderId: string, status: string): string {
    const messages: Record<string, string> = {
      pending: `⏳ *Order Pending*\n\nYour order #${orderId} is pending confirmation.\n\nWe will review your order and send you a confirmation shortly.\n\nThank you for your patience!`,
      
      confirmed: `✅ *Order Confirmed*\n\nYour order #${orderId} has been received and confirmed.\n\nYour items are ready. You will be notified when your order is on its way.\n\nThank you for your purchase!`,
      
      in_transit: `🚚 *Order in Transit*\n\nGreat news! Your order #${orderId} is on its way!\n\nYour order has been dispatched and is currently in transit. You should receive it shortly.\n\nThank you for your patience!`
    };

    return messages[status] || `Your order #${orderId} status has been updated to: ${status}`;
  }
}
