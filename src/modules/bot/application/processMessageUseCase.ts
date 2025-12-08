import { OpenAIProvider } from "../infrastructure/openai/openAIProvider";
import { MessagingProvider } from "../domain/messagingProviderInterface";
import { ChatHistoryRepository } from "../domain/chatHistoryRepositoryInterface";
import { logger } from "../../../utils/logger";

export class ProcessMessageUseCase {
  constructor(
    private readonly messagingProvider: MessagingProvider,
    private readonly aiAgent: OpenAIProvider,
    private readonly chatHistoryRepo: ChatHistoryRepository
  ) {}

  async run(
    content: string,
    chatId: string,
    senderName: string
  ): Promise<void> {
    try {
      logger.info("Processing user message", { 
        senderName, 
        chatId, 
        messageLength: content.length 
      });

      // 1. Load History (Context) using the repository
      // We fetch the last 10 messages to provide context without spending too many tokens
      const history = await this.chatHistoryRepo.getHistory(chatId, 10);

      // 2. Execute the Agent
      // The agent (OpenAIProvider) handles the thinking loop, product search, and order creation
      const responseText = await this.aiAgent.runAgent(
        chatId,
        content,
        history
      );

      // 3. Respond to the user on Telegram
      await this.messagingProvider.sendMessage(chatId, responseText);

      // 4. Save the new interaction in the History (Memory persistence)
      // We save both what the user said and what the bot responded
      await this.chatHistoryRepo.saveMessages(chatId, [
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
