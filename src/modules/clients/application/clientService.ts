import { supabase } from "../../../config/supabase";
import { Client } from "../../../schemas"; // Import from centralized schemas
import { logger } from "../../../utils/logger";

export class ClientService {
    /**
     * Finds a client by telegram_id and store_id, or creates it if it doesn't exist.
     * Updates last_interaction if found.
     */
    async findOrCreateClient(
        storeId: string,
        telegramId: number,
        userInfo: {
            username?: string;
            first_name?: string;
            last_name?: string;
            phone_number?: string;
        }
    ): Promise<Client> {
        try {
            // 1. Try to find the client
            const { data: existingClient, error: findError } = await supabase
                .from("clients")
                .select("*")
                .eq("store_id", storeId)
                .eq("telegram_id", telegramId)
                .single();

            if (findError && findError.code !== "PGRST116") { // PGRST116 is "Row not found"
                logger.error("Error finding client", { error: findError, storeId, telegramId });
                throw new Error("Database error finding client");
            }

            if (existingClient) {
                // Client exists, return it.
                // Client exists, return it.
                // We do not update last_interaction because the column does not exist in the definitive schema.
                return existingClient as Client;
            }

            // 2. Create new client
            const { data: newClient, error: createError } = await supabase
                .from("clients")
                .insert({
                    store_id: storeId,
                    telegram_id: telegramId,
                    username: userInfo.username,
                    first_name: userInfo.first_name,
                    last_name: userInfo.last_name,
                    phone_number: userInfo.phone_number,
                })
                .select()
                .single();

            if (createError) {
                logger.error("Error creating client", { error: createError, storeId, telegramId });
                throw new Error("Database error creating client");
            }

            return newClient as Client;

        } catch (error) {
            logger.error("Error in findOrCreateClient", error);
            throw error;
        }
    }
}
