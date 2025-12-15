import { supabase } from "../../../../config/supabase";
import { Store } from "../../domain/storeInterface";
import { StoreRepository, CreateStoreData, UpdateStoreData } from "../../domain/storeRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseStoreRepository implements StoreRepository {
    async getStoreById(id: string): Promise<Store | null> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
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
            if (error.code === 'PGRST116') return null;
            logger.error("Error getting store by slug", { error, slug });
            return null;
        }

        return data as Store;
    }

    async getStoresByOwnerId(ownerId: string): Promise<Store[]> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });

        if (error) {
            logger.error("Error getting stores by owner ID", { error, ownerId });
            return [];
        }

        return data as Store[];
    }

    async createStore(storeData: CreateStoreData): Promise<Store> {
        const { data, error } = await supabase
            .from("stores")
            .insert({
                name: storeData.name,
                slug: storeData.slug,
                owner_id: storeData.owner_id,
                telegram_bot_token: storeData.telegram_bot_token,
                system_prompt: storeData.system_prompt,
                address: storeData.address,
                phone: storeData.phone,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            logger.error("Error creating store", { error, storeData });
            throw new Error('Error al crear la tienda');
        }

        return data as Store;
    }

    async updateStore(id: string, updateData: UpdateStoreData): Promise<Store> {
        const { data, error } = await supabase
            .from("stores")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            logger.error("Error updating store", { error, id, updateData });
            throw new Error('Error al actualizar la tienda');
        }

        return data as Store;
    }

    async deleteStore(id: string): Promise<void> {
        const { error } = await supabase
            .from("stores")
            .delete()
            .eq("id", id);

        if (error) {
            logger.error("Error deleting store", { error, id });
            throw new Error('Error al eliminar la tienda');
        }
    }

    async isStoreOwner(storeId: string, ownerId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from("stores")
            .select("owner_id")
            .eq("id", storeId)
            .single();

        if (error || !data) {
            return false;
        }

        return data.owner_id === ownerId;
    }
}
