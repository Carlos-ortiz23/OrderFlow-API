import { JwtPayload, AuthTokens } from '../authInterface';

export interface ITokenService {
    generateTokens(payload: JwtPayload): AuthTokens;
    verifyAccessToken(token: string): JwtPayload;
    verifyRefreshToken(token: string): JwtPayload;
}
