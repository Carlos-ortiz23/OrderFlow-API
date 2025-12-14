import { Router } from "express";
import { SupabaseStoreRepository } from "./infrastructure/database/supabaseStoreRepository";
import { StoreController } from "./infrastructure/storeController";

const storeRouter = Router();

const storeRepository = new SupabaseStoreRepository();
const storeController = new StoreController(storeRepository);

storeRouter.get("/:id", storeController.getStore);

export { storeRouter };
