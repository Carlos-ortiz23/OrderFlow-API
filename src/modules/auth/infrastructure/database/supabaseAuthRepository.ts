import { supabase } from "../../../../config/supabase";
import { User } from "../../../users/domain/userInterface";
import { AuthRepository } from "../../domain/authRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseAuthRepository implements AuthRepository {
    async createUser(email: string, passwordHash: string, fullName?: string): Promise<User> {
        const { data, error } = await supabase
            .from("users")
            .insert({
                email,
                password_hash: passwordHash,
                full_name: fullName,
                role: 'owner'
            })
            .select()
            .single();

        if (error) {
            logger.error("Error creating user", { error, email });
            throw new Error('Error creating user');
        }

        return data as User;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            logger.error("Error retrieving user by email", { error, email });
            return null;
        }

        return data as User;
    }

    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            logger.error("Error retrieving user by ID", { error, id });
            return null;
        }

        return data as User;
    }

    async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
        const { error } = await supabase
            .from("users")
            .update({ password_hash: newPasswordHash })
            .eq("id", userId);

        if (error) {
            logger.error("Error updating password", { error, userId });
            throw new Error('Error updating password');
        }
    }
}
