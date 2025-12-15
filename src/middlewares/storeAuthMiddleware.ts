import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Middleware to verify if the authenticated user has access to the specified store
 * This ensures users can only access/modify resources belonging to their stores
 */
export const verifyStoreAccess = (storeIdParam: string = 'storeId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Must be authenticated first
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const userId = req.user.userId;
      
      // Get storeId from request parameters, query or body
      const storeId = req.params[storeIdParam] || req.query[storeIdParam] || req.body[storeIdParam];
      
      if (!storeId) {
        res.status(400).json({
          success: false,
          message: `Store ID is required (${storeIdParam})`
        });
        return;
      }

      // Connect to database using the existing client
      
      // Check if user owns or has access to this store
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Database error when verifying store access', { error });
        res.status(500).json({
          success: false,
          message: 'Error verifying store access'
        });
        return;
      }

      if (!data) {
        // If not direct owner, check if user has been granted access to this store
        // This could be extended to check a store_users table for collaborators
        const { data: userAccess, error: accessError } = await supabase
          .from('users')
          .select('store_id')
          .eq('id', userId)
          .eq('store_id', storeId)
          .maybeSingle();

        if (accessError) {
          logger.error('Database error when checking user store access', { error: accessError });
          res.status(500).json({
            success: false,
            message: 'Error verifying store access'
          });
          return;
        }

        if (!userAccess) {
          res.status(403).json({
            success: false,
            message: 'You do not have access to this store'
          });
          return;
        }
      }

      // Store the verified storeId in the request for later use
      req.storeId = storeId;
      next();
    } catch (error) {
      logger.error('Error in store access verification middleware', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};


// Extend the AuthRequest interface to include storeId
declare module 'express' {
  interface Request {
    storeId?: string;
  }
}
