import { supabase } from "../../../../config/supabase";
import { Store } from "../../domain/storeInterface";
import { StoreRepository } from "../../domain/storeRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseStoreRepository implements StoreRepository {
    async getStoreById(id: string): Promise<Store | null> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            logger.error("Error getting store by ID", { error, id });
            return null;
        }

        return data as Store;
    }

    async getStoreBySlug(slug: string): Promise<Store | null> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            logger.error("Error getting store by slug", { error, slug });
            return null;
        }

        return data as Store;
    }
}
