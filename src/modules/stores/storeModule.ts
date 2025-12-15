import { Router } from "express";
import { SupabaseStoreRepository } from "./infrastructure/database/supabaseStoreRepository";
import { StoreController } from "./infrastructure/storeController";
import { authMiddleware } from "../../middlewares/authMiddleware";

const storeRouter = Router();

const storeRepository = new SupabaseStoreRepository();
const storeController = new StoreController(storeRepository);

storeRouter.get("/my-stores", authMiddleware, storeController.getMyStores);
storeRouter.post("/", authMiddleware, storeController.createStore);
storeRouter.get("/slug/:slug", storeController.getStoreBySlug);
storeRouter.get("/:id", storeController.getStore);
storeRouter.put("/:id", authMiddleware, storeController.updateStore);
storeRouter.delete("/:id", authMiddleware, storeController.deleteStore);

export { storeRouter };
