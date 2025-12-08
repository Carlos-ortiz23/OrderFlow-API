import { supabase } from "../../../../config/supabase";
import {
  ChatHistoryRepository,
  ChatMessage,
} from "../../domain/chatHistoryRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseChatHistoryRepository implements ChatHistoryRepository {
  /**
   * Gets the message history of a user
   */
  async getHistory(userId: string, limit: number = 10): Promise<ChatMessage[]> {
    // Validate reasonable limit to avoid consuming too many tokens
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    
    const { data, error } = await supabase
      .from("chat_history")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      logger.error("Error getting history", { error, userId, limit: safeLimit });
      return [];
    }

    // Reverse for chronological order (oldest first)
    return (data || []).reverse().map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      created_at: msg.created_at,
    }));
  }

  /**
   * Saves messages in the history
   */
  async saveMessages(userId: string, messages: ChatMessage[]): Promise<void> {
    const messagesToInsert = messages.map((msg) => ({
      user_id: userId,
      role: msg.role,
      content: msg.content,
    }));

    const { error } = await supabase
      .from("chat_history")
      .insert(messagesToInsert);

    if (error) {
      logger.error("Error saving messages", { error, userId, messageCount: messages.length });
      throw new Error("Error saving chat history");
    }
  }
}
