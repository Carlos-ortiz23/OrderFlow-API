import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ITokenService';
import { JwtPayload, AuthTokens } from '../../domain/authInterface';
import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import { envConfig } from '../../../../config/env.config';
import { logger } from '../../../../utils/logger';

export class JwtTokenService implements ITokenService {
    private readonly jwtSecret: string;
    private readonly accessTokenExpiration: string;
    private readonly refreshTokenExpiration: string;

    constructor() {
        this.jwtSecret = envConfig.JWT_SECRET;
        this.accessTokenExpiration = envConfig.JWT_ACCESS_TOKEN_EXPIRATION;
        this.refreshTokenExpiration = envConfig.JWT_REFRESH_TOKEN_EXPIRATION;
    }

    generateTokens(payload: JwtPayload): AuthTokens {
        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.accessTokenExpiration as string | number,
            issuer: 'orderflow-api',
            audience: 'orderflow-client'
        } as jwt.SignOptions);

        const refreshToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiration as string | number,
            issuer: 'orderflow-api',
            audience: 'orderflow-client'
        } as jwt.SignOptions);

        return {
            accessToken,
            refreshToken
        };
    }

    verifyAccessToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'orderflow-api',
                audience: 'orderflow-client'
            }) as JwtPayload;
            
            return decoded;
        } catch (error) {
            logger.error('Error verifying access token', { error });
            throw new InvalidTokenError('Invalid or expired access token');
        }
    }

    verifyRefreshToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'orderflow-api',
                audience: 'orderflow-client'
            }) as JwtPayload;
            
            return decoded;
        } catch (error) {
            logger.error('Error verifying refresh token', { error });
            throw new InvalidTokenError('Invalid or expired refresh token');
        }
    }
}
