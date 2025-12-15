import { ValidationError } from '../errors/AuthErrors';

export interface IAuthValidator {
    validateEmail(email: string): void;
    validatePassword(password: string): void;
    validateRegistrationData(email: string, password: string): void;
}

export class AuthValidator implements IAuthValidator {
    private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private readonly MIN_PASSWORD_LENGTH = 6;
    private readonly MAX_PASSWORD_LENGTH = 128;

    validateEmail(email: string): void {
        if (!email) {
            throw new ValidationError('Email is required');
        }

        if (typeof email !== 'string') {
            throw new ValidationError('Email must be a string');
        }

        if (!this.EMAIL_REGEX.test(email)) {
            throw new ValidationError('Invalid email format');
        }

        if (email.length > 255) {
            throw new ValidationError('Email is too long');
        }
    }

    validatePassword(password: string): void {
        if (!password) {
            throw new ValidationError('Password is required');
        }

        if (typeof password !== 'string') {
            throw new ValidationError('Password must be a string');
        }

        if (password.length < this.MIN_PASSWORD_LENGTH) {
            throw new ValidationError(
                `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`
            );
        }

        if (password.length > this.MAX_PASSWORD_LENGTH) {
            throw new ValidationError(
                `Password cannot exceed ${this.MAX_PASSWORD_LENGTH} characters`
            );
        }
    }

    validateRegistrationData(email: string, password: string): void {
        this.validateEmail(email);
        this.validatePassword(password);
    }
}
