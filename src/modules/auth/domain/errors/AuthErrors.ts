export class AuthError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
        public readonly code?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidCredentialsError extends AuthError {
    constructor(message: string = 'Invalid credentials') {
        super(message, 401, 'INVALID_CREDENTIALS');
    }
}

export class UserAlreadyExistsError extends AuthError {
    constructor(message: string = 'Email is already registered') {
        super(message, 409, 'USER_ALREADY_EXISTS');
    }
}

export class InvalidTokenError extends AuthError {
    constructor(message: string = 'Invalid or expired token') {
        super(message, 401, 'INVALID_TOKEN');
    }
}

export class UserNotFoundError extends AuthError {
    constructor(message: string = 'User not found') {
        super(message, 404, 'USER_NOT_FOUND');
    }
}

export class ValidationError extends AuthError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
