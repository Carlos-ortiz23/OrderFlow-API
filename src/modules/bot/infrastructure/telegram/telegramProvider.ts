import axios from "axios";
import { envConfig } from "../../../../config/env.config";
import { MessagingProvider } from "../../domain/messagingProviderInterface";
import { logger } from "../../../../utils/logger";

export class TelegramProvider implements MessagingProvider {
  private readonly apiUrl: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  constructor() {
    this.apiUrl = `https://api.telegram.org/bot${envConfig.TELEGRAM_BOT_TOKEN}`;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    // Validate input
    if (!chatId || !text) {
      logger.warn("Attempt to send message with invalid data", { chatId, text });
      throw new Error("chatId and text are required to send a message");
    }

    let lastError: any;
    
    // Implement retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await axios.post(`${this.apiUrl}/sendMessage`, {
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        });
        
        // If we get here, the message was sent successfully
        if (attempt > 1) {
          logger.info(`Message sent successfully after ${attempt} attempts`, { chatId });
        }
        return;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.response?.data?.description || error.message;
        
        logger.warn(`Error sending message (attempt ${attempt}/${this.maxRetries})`, {
          chatId,
          error: errorMessage,
          attempt
        });

        // If it's not the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // If we get here, all attempts failed
    logger.error("Critical error: Could not send message after multiple attempts", {
      chatId,
      error: lastError.response?.data || lastError.message
    });
    
    throw new Error(`Could not send message to Telegram after ${this.maxRetries} attempts`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
