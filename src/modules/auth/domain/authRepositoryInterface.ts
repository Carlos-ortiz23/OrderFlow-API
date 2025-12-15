import { User } from "../../users/domain/userInterface";

export interface AuthRepository {
    createUser(email: string, passwordHash: string, fullName?: string): Promise<User>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
}
