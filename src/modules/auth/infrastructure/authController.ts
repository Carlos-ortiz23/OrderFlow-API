import { Request, Response } from 'express';
import { IAuthService } from '../application/authService';
import { LoginCredentials, RegisterData } from '../domain/authInterface';
import { AuthError } from '../domain/errors/AuthErrors';
import { logger } from '../../../utils/logger';
import { AuthRequest } from '../../../middlewares/authMiddleware';

export class AuthController {
    constructor(private readonly authService: IAuthService) {}

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password, full_name } = req.body;

            const registerData: RegisterData = {
                email,
                password,
                full_name
            };

            const result = await this.authService.register(registerData);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error: any) {
            this.handleError(error, res, 'Error in user registration');
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            const credentials: LoginCredentials = {
                email,
                password
            };

            const result = await this.authService.login(credentials);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error: any) {
            this.handleError(error, res, 'Error in login');
        }
    };

    getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
                return;
            }

            const user = await this.authService.getUserById(req.user.userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error: any) {
            logger.error('Error retrieving profile', { error, userId: req.user?.userId });

            res.status(500).json({
                success: false,
                message: 'Error retrieving user profile'
            });
        }
    };

    verifyToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token } = req.body;

            if (!token) {
                res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
                return;
            }

            const payload = await this.authService.verifyAccessToken(token);

            res.status(200).json({
                success: true,
                data: payload
            });
        } catch (error: any) {
            this.handleError(error, res, 'Error verifying token');
        }
    };

    refreshToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
                return;
            }

            const result = await this.authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: result
            });
        } catch (error: any) {
            this.handleError(error, res, 'Error refreshing token');
        }
    };

    private handleError(error: any, res: Response, context: string): void {
        logger.error(context, { error });

        if (error instanceof AuthError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
