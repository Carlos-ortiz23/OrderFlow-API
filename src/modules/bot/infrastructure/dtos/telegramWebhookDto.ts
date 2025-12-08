/**
 * DTOs to validate Telegram webhook data
 */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

/**
 * Validates if an object is a valid Telegram webhook
 */
export class TelegramWebhookValidator {
  static isValidUpdate(data: any): data is TelegramWebhookUpdate {
    if (!data || typeof data !== "object") {
      return false;
    }

    // Must have update_id
    if (typeof data.update_id !== "number") {
      return false;
    }

    // Must have at least one message type
    const hasMessage =
      data.message ||
      data.edited_message ||
      data.channel_post ||
      data.edited_channel_post;

    return !!hasMessage;
  }

  static isTextMessage(update: TelegramWebhookUpdate): boolean {
    const message = update.message || update.edited_message;
    return !!message && typeof message.text === "string" && message.text.length > 0;
  }

  static extractMessageData(update: TelegramWebhookUpdate): {
    chatId: string;
    text: string;
    senderName: string;
  } | null {
    const message = update.message || update.edited_message;

    if (!message || !message.text) {
      return null;
    }

    return {
      chatId: message.chat.id.toString(),
      text: message.text.trim(),
      senderName: message.from?.first_name || "Customer",
    };
  }
}
