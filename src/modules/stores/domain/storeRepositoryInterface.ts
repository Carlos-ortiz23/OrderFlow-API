import { Store } from "./storeInterface";

export interface CreateStoreData {
    name: string;
    slug: string;
    owner_id: string;
    telegram_bot_token?: string;
    system_prompt?: string;
    address?: string;
    phone?: string;
}

export interface UpdateStoreData {
    name?: string;
    slug?: string;
    telegram_bot_token?: string;
    system_prompt?: string;
    address?: string;
    phone?: string;
    is_active?: boolean;
}

export interface StoreRepository {
    getStoreById(id: string): Promise<Store | null>;
    getStoreBySlug(slug: string): Promise<Store | null>;
    getStoresByOwnerId(ownerId: string): Promise<Store[]>;
    createStore(data: CreateStoreData): Promise<Store>;
    updateStore(id: string, data: UpdateStoreData): Promise<Store>;
    deleteStore(id: string): Promise<void>;
    isStoreOwner(storeId: string, ownerId: string): Promise<boolean>;
}
