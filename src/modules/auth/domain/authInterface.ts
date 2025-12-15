export interface AuthUser {
    id: string;
    email: string;
    full_name?: string | null;
    role: string;
    created_at?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
}

export interface AuthResponse {
    user: AuthUser;
    tokens: AuthTokens;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
