import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import axios from 'axios';
import { logger } from '../../../../utils/logger';

/**
 * Service to interact with BotFather and manage Telegram bots
 */
export class BotFatherService {
  private client: TelegramClient | null = null;
  private botFatherId = 93372553; // BotFather's ID
  private initialized = false;

  constructor() {
    // No inicializar el cliente en el constructor
    // Se inicializará bajo demanda cuando sea necesario
  }

  /**
   * Initialize the Telegram client
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Verificar si las credenciales están disponibles
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
    const apiHash = process.env.TELEGRAM_API_HASH || '';
    const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

    // Validar credenciales
    if (!apiId || !apiHash) {
      logger.error('Telegram API ID or Hash not provided');
      throw new Error('Telegram API ID or Hash not provided. Please set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables.');
    }

    try {
      // Crear el cliente solo cuando sea necesario
      this.client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });
      
      await this.client.connect();
      this.initialized = true;
      logger.info('Telegram client connected successfully');
    } catch (error) {
      logger.error('Failed to connect Telegram client', { error });
      throw new Error('Failed to connect to Telegram');
    }
  }

  /**
   * Normalize a store name to create a valid bot username
   */
  normalizeUsername(input: string): string {
    // Remove spaces and special characters
    let normalized = input
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '')
      .trim();

    // Ensure it's not too long (Telegram has a 64 character limit)
    normalized = normalized.substring(0, 60);

    // Ensure it ends with 'bot' or 'Bot'
    if (!normalized.toLowerCase().endsWith('bot')) {
      normalized += 'Bot';
    }

    return normalized;
  }

  /**
   * Send a message to BotFather and wait for response
   */
  private async sendMessageAndWaitForResponse(message: string): Promise<string> {
    await this.initialize();

    // Después de initialize(), this.client debería estar inicializado
    if (!this.client) {
      throw new Error('Telegram client not initialized');
    }

    try {
      // Send message to BotFather
      await this.client.sendMessage(this.botFatherId, { message });

      // Wait for a short time to appear more human-like
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get response from BotFather
      const messages = await this.client.getMessages(this.botFatherId, { limit: 1 });
      if (messages.length === 0) {
        throw new Error('No response received from BotFather');
      }

      return messages[0].message;
    } catch (error) {
      logger.error('Error communicating with BotFather', { error });
      throw new Error('Failed to communicate with BotFather');
    }
  }

  /**
   * Create a new bot via BotFather
   */
  async createBot(storeName: string, proposedUsername?: string): Promise<{ token: string, username: string, botId: string }> {
    // Step 1: Start the bot creation process
    const initialResponse = await this.sendMessageAndWaitForResponse('/newbot');
    
    if (!initialResponse.includes('Alright') && !initialResponse.includes('choose a name')) {
      throw new Error('Unexpected response from BotFather when starting bot creation');
    }

    // Step 2: Send the bot name (display name)
    const nameResponse = await this.sendMessageAndWaitForResponse(storeName);
    
    if (!nameResponse.includes('username') && !nameResponse.includes('choose a username')) {
      throw new Error('BotFather did not ask for a username');
    }

    // Step 3: Generate and send the username
    const normalizedUsername = this.normalizeUsername(proposedUsername || storeName);
    const usernameResponse = await this.sendMessageAndWaitForResponse(normalizedUsername);

    // Step 4: Check if the username was accepted
    if (usernameResponse.toLowerCase().includes('sorry') || 
        usernameResponse.toLowerCase().includes('taken') || 
        usernameResponse.toLowerCase().includes('invalid')) {
      
      // Try with a random suffix
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const alternativeUsername = this.normalizeUsername(storeName) + randomSuffix;
      
      const retryResponse = await this.sendMessageAndWaitForResponse(alternativeUsername);
      
      if (retryResponse.toLowerCase().includes('sorry') || 
          retryResponse.toLowerCase().includes('taken') || 
          retryResponse.toLowerCase().includes('invalid')) {
        throw new Error('Could not create bot with the provided name, username already taken');
      }
      
      return this.extractBotInfo(retryResponse, alternativeUsername);
    }

    // Extract token and other info from successful response
    return this.extractBotInfo(usernameResponse, normalizedUsername);
  }

  /**
   * Extract bot information from BotFather's response
   */
  private extractBotInfo(response: string, username: string): { token: string, username: string, botId: string } {
    // Extract the token using regex
    const tokenRegex = /(\d+:[A-Za-z0-9_-]{35})/;
    const tokenMatch = response.match(tokenRegex);

    if (!tokenMatch) {
      throw new Error('Could not extract bot token from BotFather response');
    }

    const token = tokenMatch[1];
    
    // Extract bot ID from token
    const botId = token.split(':')[0];
    
    // Ensure username has @ prefix for consistency
    const formattedUsername = username.startsWith('@') ? username : '@' + username;

    return {
      token,
      username: formattedUsername,
      botId
    };
  }

  /**
   * Set webhook for a bot
   */
  async setWebhook(token: string, storeId: string): Promise<boolean> {
    const publicApiUrl = process.env.PUBLIC_API_URL || 'https://orderflow-api-831973953542.northamerica-south1.run.app';
    const webhookUrl = `${publicApiUrl}/api/bot/webhook/${storeId}`;

    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: webhookUrl,
        drop_pending_updates: true
      });

      if (response.data.ok) {
        logger.info('Webhook set successfully', { storeId, webhookUrl });
        return true;
      } else {
        logger.error('Failed to set webhook', { storeId, error: response.data });
        return false;
      }
    } catch (error) {
      logger.error('Error setting webhook', { storeId, error });
      return false;
    }
  }
}
