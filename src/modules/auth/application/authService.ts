import { AuthRepository } from '../domain/authRepositoryInterface';
import { AuthResponse, JwtPayload, LoginCredentials, RegisterData, AuthUser } from '../domain/authInterface';
import { IPasswordHasher } from '../domain/services/IPasswordHasher';
import { ITokenService } from '../domain/services/ITokenService';
import { IAuthValidator } from '../domain/validators/AuthValidator';
import { 
    InvalidCredentialsError, 
    UserAlreadyExistsError, 
    UserNotFoundError 
} from '../domain/errors/AuthErrors';
import { logger } from '../../../utils/logger';

export interface IAuthService {
    register(data: RegisterData): Promise<AuthResponse>;
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    getUserById(userId: string): Promise<AuthUser>;
}

export class AuthService implements IAuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly tokenService: ITokenService,
        private readonly validator: IAuthValidator
    ) {}

    async register(data: RegisterData): Promise<AuthResponse> {
        this.validator.validateRegistrationData(data.email, data.password);

        const existingUser = await this.authRepository.getUserByEmail(data.email);
        if (existingUser) {
            throw new UserAlreadyExistsError();
        }

        const passwordHash = await this.passwordHasher.hash(data.password);

        const user = await this.authRepository.createUser(
            data.email,
            passwordHash,
            data.full_name
        );

        const tokens = this.tokenService.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        logger.info('Usuario registrado exitosamente', { userId: user.id, email: user.email });

        return {
            user: this.mapToAuthUser(user),
            tokens
        };
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        this.validator.validateEmail(credentials.email);
        this.validator.validatePassword(credentials.password);

        const user = await this.authRepository.getUserByEmail(credentials.email);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        const isPasswordValid = await this.passwordHasher.compare(
            credentials.password, 
            user.password_hash
        );
        
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        const tokens = this.tokenService.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        logger.info('Usuario autenticado exitosamente', { userId: user.id, email: user.email });

        return {
            user: this.mapToAuthUser(user),
            tokens
        };
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const payload = this.tokenService.verifyRefreshToken(refreshToken);

        const user = await this.authRepository.getUserById(payload.userId);
        if (!user) {
            throw new UserNotFoundError();
        }

        const tokens = this.tokenService.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        logger.info('Token renovado exitosamente', { userId: user.id });

        return {
            user: this.mapToAuthUser(user),
            tokens
        };
    }

    async verifyAccessToken(token: string): Promise<JwtPayload> {
        return this.tokenService.verifyAccessToken(token);
    }

    async getUserById(userId: string): Promise<AuthUser> {
        const user = await this.authRepository.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError();
        }

        return this.mapToAuthUser(user);
    }

    private mapToAuthUser(user: any): AuthUser {
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at
        };
    }
}
