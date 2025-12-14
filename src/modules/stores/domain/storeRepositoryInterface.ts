import { Store } from "./storeInterface";

export interface StoreRepository {
    getStoreById(id: string): Promise<Store | null>;
    getStoreBySlug(slug: string): Promise<Store | null>;
}
