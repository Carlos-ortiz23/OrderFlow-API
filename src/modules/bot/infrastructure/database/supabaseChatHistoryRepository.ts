import { supabase } from "../../../../config/supabase";
import {
  ChatHistoryRepository,
  ChatMessage,
} from "../../domain/chatHistoryRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseChatHistoryRepository implements ChatHistoryRepository {
  /**
   * Gets the message history of a client
   */
  async getHistory(clientId: string, limit: number = 10): Promise<ChatMessage[]> {
    // Validate reasonable limit
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    // Join with chat_roles to get the role code
    const { data, error } = await supabase
      .from("messages")
      .select(`
        content,
        created_at,
        chat_roles (
          code
        )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      logger.error("Error getting history", { error, clientId, limit: safeLimit });
      return [];
    }

    // Reverse for chronological order (oldest first)
    return (data || []).reverse().map((msg: any) => ({
      // @ts-ignore
      role: msg.chat_roles?.code as "user" | "assistant" | "system",
      content: msg.content,
      created_at: msg.created_at,
    }));
  }

  /**
   * Saves messages in the history
   */
  async saveMessages(clientId: string, messages: ChatMessage[]): Promise<void> {
    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from("chat_roles")
      .select("id, code");

    if (rolesError || !roles) {
      logger.error("Error fetching chat roles", rolesError);
      throw new Error("Could not fetch chat roles");
    }

    const roleMap = new Map(roles.map((r) => [r.code, r.id]));

    const messagesToInsert = messages.map((msg) => {
      const roleId = roleMap.get(msg.role);
      if (!roleId) {
        // Fallback or error. For robustness, if 'function' role appears (unlikely in this simple bot), map to system or assistant.
        // Assuming strict types:
        throw new Error(`Invalid role: ${msg.role}`);
      }
      return {
        client_id: clientId,
        role_id: roleId,
        content: msg.content,
      };
    });

    const { error } = await supabase
      .from("messages")
      .insert(messagesToInsert);

    if (error) {
      logger.error("Error saving messages", { error, clientId, messageCount: messages.length });
      throw new Error("Error saving chat history");
    }
  }
}
