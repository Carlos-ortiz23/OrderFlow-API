import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher';
import { envConfig } from '../../../../config/env.config';

export class BcryptPasswordHasher implements IPasswordHasher {
    private readonly saltRounds: number;

    constructor() {
        this.saltRounds = envConfig.BCRYPT_SALT_ROUNDS;
    }

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
