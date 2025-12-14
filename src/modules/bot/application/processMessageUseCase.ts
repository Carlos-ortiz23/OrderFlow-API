import { LLMProvider } from "../infrastructure/llm/llmProvider";
import { MessagingProvider } from "../domain/messagingProviderInterface";
import { ChatHistoryRepository } from "../domain/chatHistoryRepositoryInterface";
import { logger } from "../../../utils/logger";

export class ProcessMessageUseCase {
  constructor(
    private readonly messagingProvider: MessagingProvider,
    private readonly aiAgent: LLMProvider,
    private readonly chatHistoryRepo: ChatHistoryRepository
  ) { }

  async run(
    content: string,
    client: any, // Using any for now to avoid circular dependency or import issues, will fix import
    storeId: string
  ): Promise<void> {
    const chatId = client.telegram_id.toString();
    const senderName = client.first_name || "Customer";
    try {
      logger.info("Processing user message", {
        senderName,
        chatId,
        messageLength: content.length
      });

      // 1. Load History (Context) using the repository
      // We fetch the last 10 messages to provide context without spending too many tokens
      // NOW using client.id (UUID) instead of chatId (Telegram ID)
      const history = await this.chatHistoryRepo.getHistory(client.id, 10);

      // 2. Execute the Agent
      // The agent (OpenAIProvider) handles the thinking loop, product search, and order creation
      const responseText = await this.aiAgent.runAgent(
        client.id, // Pass client.id instead of chatId
        content,
        history,
        storeId // Pass storeId for context/products
      );

      // 3. Respond to the user on Telegram
      await this.messagingProvider.sendMessage(chatId, responseText);

      // 4. Save the new interaction in the History (Memory persistence)
      // We save both what the user said and what the bot responded
      await this.chatHistoryRepo.saveMessages(client.id, [
        { role: "user", content: content },
        { role: "assistant", content: responseText },
      ]);
    } catch (error) {
      logger.error("Critical error in UseCase", { error, chatId, senderName });
      await this.messagingProvider.sendMessage(
        chatId,
        "Sorry, an error occurred while processing your message. Please try again."
      );
    }
  }
}
