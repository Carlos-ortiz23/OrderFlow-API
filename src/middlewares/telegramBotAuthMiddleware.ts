import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Interface for requests with Telegram bot token
 */
export interface BotRequest extends Request {
  store?: {
    id: string;
    name: string;
  };
}

/**
 * Core function to verify bot token against database
 * Reused by both header and query parameter middlewares
 */
const verifyBotToken = async (
  botToken: string | undefined,
  req: BotRequest,
  res: Response,
  next: NextFunction,
  source: 'header' | 'query'
): Promise<void> => {
  try {
    if (!botToken) {
      res.status(401).json({
        success: false,
        message: `Bot token not provided${source === 'query' ? ' in query' : ''}`
      });
      return;
    }

    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('telegram_bot_token', botToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('Database error when verifying bot token', { error, source });
      res.status(500).json({
        success: false,
        message: 'Error verifying bot token'
      });
      return;
    }

    if (!data) {
      res.status(401).json({
        success: false,
        message: 'Invalid bot token'
      });
      return;
    }

    req.store = {
      id: data.id,
      name: data.name
    };

    next();
  } catch (error) {
    logger.error('Error in Telegram bot authentication middleware', { error, source });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to authenticate Telegram bot webhook requests via header
 * Verifies the bot token against the store's registered token
 */
export const telegramBotAuthMiddleware = (
  req: BotRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const botToken = req.headers['x-telegram-bot-token'] as string;
  return verifyBotToken(botToken, req, res, next, 'header');
};

/**
 * Middleware to authenticate Telegram bot via query parameter
 * Useful for webhook setup where headers might not be configurable
 */
export const telegramBotQueryAuthMiddleware = (
  req: BotRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const botToken = req.query.token as string;
  return verifyBotToken(botToken, req, res, next, 'query');
};
