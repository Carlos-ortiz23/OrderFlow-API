// Interface for messaging providers (e.g. Telegram, WhatsApp)
export interface MessagingProvider {
  sendMessage(chatId: string, text: string): Promise<void>;
}
