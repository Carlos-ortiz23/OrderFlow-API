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
 * Middleware to authenticate Telegram bot webhook requests
 * Verifies the bot token against the store's registered token
 */
export const telegramBotAuthMiddleware = async (
  req: BotRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get bot token from header
    const botToken = req.headers['x-telegram-bot-token'] as string;
    
    if (!botToken) {
      res.status(401).json({
        success: false,
        message: 'Bot token not provided'
      });
      return;
    }

    // Find store with matching bot token
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('telegram_bot_token', botToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('Database error when verifying bot token', { error });
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

    // Store information is now available in the request
    req.store = {
      id: data.id,
      name: data.name
    };

    next();
  } catch (error) {
    logger.error('Error in Telegram bot authentication middleware', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Alternative authentication for bot using query parameter
 * This is useful for webhook setup where headers might not be configurable
 */
export const telegramBotQueryAuthMiddleware = async (
  req: BotRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get bot token from query parameter
    const botToken = req.query.token as string;
    
    if (!botToken) {
      res.status(401).json({
        success: false,
        message: 'Bot token not provided in query'
      });
      return;
    }

    // Find store with matching bot token
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('telegram_bot_token', botToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('Database error when verifying bot token', { error });
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

    // Store information is now available in the request
    req.store = {
      id: data.id,
      name: data.name
    };

    next();
  } catch (error) {
    logger.error('Error in Telegram bot query authentication middleware', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
