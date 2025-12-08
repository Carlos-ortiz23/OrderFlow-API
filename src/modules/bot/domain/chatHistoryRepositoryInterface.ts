/**
 * Represents a message in the chat history
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

/**
 * Chat history repository interface
 * Defines the contract for managing conversation history
 */
export interface ChatHistoryRepository {
  /**
   * Gets the message history of a user
   * @param userId - User ID
   * @param limit - Maximum number of messages to retrieve (default 10)
   * @returns List of messages ordered chronologically
   */
  getHistory(userId: string, limit?: number): Promise<ChatMessage[]>;

  /**
   * Saves messages in the history
   * @param userId - User ID
   * @param messages - Messages to save
   */
  saveMessages(userId: string, messages: ChatMessage[]): Promise<void>;
}
