import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../modules/auth/domain/authInterface';
import { JwtTokenService } from '../modules/auth/infrastructure/services/JwtTokenService';
import { InvalidTokenError } from '../modules/auth/domain/errors/AuthErrors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

const tokenService = new JwtTokenService();

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Authentication token not provided'
            });
            return;
        }

        const token = authHeader.substring(7);

        try {
            const decoded = tokenService.verifyAccessToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            if (error instanceof InvalidTokenError) {
                res.status(401).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            
            logger.error('Error verifying token', { error });
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }
    } catch (error) {
        logger.error('Error in authentication middleware', { error });
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const optionalAuthMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = tokenService.verifyAccessToken(token);
                req.user = decoded;
            } catch (error) {
                logger.warn('Invalid token in optional authentication', { error });
            }
        }

        next();
    } catch (error) {
        logger.error('Error in optional authentication middleware', { error });
        next();
    }
};

export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
            return;
        }

        next();
    };
};
