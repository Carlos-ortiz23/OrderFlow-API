import { supabase } from "../../../../config/supabase";
import { User, UserRepository } from "../../domain/userInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseUserRepository implements UserRepository {
    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            logger.error("Error getting user by ID", { error, id });
            return null;
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
            logger.error("Error getting user by email", { error, email });
            return null;
        }

        return data as User;
    }
}
