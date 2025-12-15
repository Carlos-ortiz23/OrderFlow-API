import { Request, Response } from "express";
import { StoreRepository, CreateStoreData, UpdateStoreData } from "../domain/storeRepositoryInterface";
import { logger } from "../../../utils/logger";
import { AuthRequest } from "../../../middlewares/authMiddleware";

export class StoreController {
    constructor(private readonly storeRepo: StoreRepository) { }

    getStore = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const store = await this.storeRepo.getStoreById(id);

            if (!store) {
                return res.status(404).json({ success: false, message: "Store not found" });
            }

            return res.status(200).json({ success: true, data: store });
        } catch (error) {
            logger.error("Error in getStore controller", { error });
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    };

    getMyStores = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: "Not authenticated" });
                return;
            }

            const stores = await this.storeRepo.getStoresByOwnerId(req.user.userId);

            res.status(200).json({
                success: true,
                data: stores,
                count: stores.length
            });
        } catch (error) {
            logger.error("Error retrieving owner's stores", { error, userId: req.user?.userId });
            res.status(500).json({ success: false, message: "Error retrieving stores" });
        }
    };

    createStore = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: "Not authenticated" });
                return;
            }

            const { name, slug, telegram_bot_token, system_prompt, address, phone } = req.body;

            if (!name) {
                res.status(400).json({
                    success: false,
                    message: "Name is required"
                });
                return;
            }
            
            // Generate slug from name if not provided
            const storeSlug = slug || name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-')        // Replace spaces with hyphens
                .replace(/-+/g, '-')         // Remove consecutive hyphens
                .trim();                     // Trim leading/trailing spaces or hyphens

            // Check if the generated or provided slug already exists
            const existingStore = await this.storeRepo.getStoreBySlug(storeSlug);
            if (existingStore) {
                res.status(409).json({
                    success: false,
                    message: "A store with that slug already exists"
                });
                return;
            }

            // Validate telegram_bot_token is provided
            if (!telegram_bot_token) {
                res.status(400).json({
                    success: false,
                    message: "Telegram bot token is required"
                });
                return;
            }

            const storeData: CreateStoreData = {
                name,
                slug: storeSlug,
                owner_id: req.user.userId,
                telegram_bot_token,
                system_prompt,
                address,
                phone
            };

            const store = await this.storeRepo.createStore(storeData);

            res.status(201).json({
                success: true,
                message: "Store created successfully",
                data: store
            });
        } catch (error) {
            logger.error("Error creating store", { error, userId: req.user?.userId });
            res.status(500).json({ success: false, message: "Error creating store" });
        }
    };

    updateStore = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: "Not authenticated" });
                return;
            }

            const { id } = req.params;
            const isOwner = await this.storeRepo.isStoreOwner(id, req.user.userId);

            if (!isOwner) {
                res.status(403).json({
                    success: false,
                    message: "You do not have permission to modify this store"
                });
                return;
            }

            const { name, slug, telegram_bot_token, system_prompt, address, phone, is_active } = req.body;

            if (slug) {
                const existingStore = await this.storeRepo.getStoreBySlug(slug);
                if (existingStore && existingStore.id !== id) {
                    res.status(409).json({
                        success: false,
                        message: "Another store with that slug already exists"
                    });
                    return;
                }
            }

            const updateData: UpdateStoreData = {
                name,
                slug,
                telegram_bot_token,
                system_prompt,
                address,
                phone,
                is_active
            };

            Object.keys(updateData).forEach(key => 
                updateData[key as keyof UpdateStoreData] === undefined && delete updateData[key as keyof UpdateStoreData]
            );

            const store = await this.storeRepo.updateStore(id, updateData);

            res.status(200).json({
                success: true,
                message: "Store updated successfully",
                data: store
            });
        } catch (error) {
            logger.error("Error updating store", { error, storeId: req.params.id });
            res.status(500).json({ success: false, message: "Error updating store" });
        }
    };

    deleteStore = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: "Not authenticated" });
                return;
            }

            const { id } = req.params;
            const isOwner = await this.storeRepo.isStoreOwner(id, req.user.userId);

            if (!isOwner) {
                res.status(403).json({
                    success: false,
                    message: "You do not have permission to delete this store"
                });
                return;
            }

            await this.storeRepo.deleteStore(id);

            res.status(200).json({
                success: true,
                message: "Store deleted successfully"
            });
        } catch (error) {
            logger.error("Error deleting store", { error, storeId: req.params.id });
            res.status(500).json({ success: false, message: "Error deleting store" });
        }
    };

    getStoreBySlug = async (req: Request, res: Response): Promise<void> => {
        try {
            const { slug } = req.params;
            const store = await this.storeRepo.getStoreBySlug(slug);

            if (!store) {
                res.status(404).json({ success: false, message: "Store not found" });
                return;
            }

            res.status(200).json({ success: true, data: store });
        } catch (error) {
            logger.error("Error retrieving store by slug", { error, slug: req.params.slug });
            res.status(500).json({ success: false, message: "Error retrieving store" });
        }
    };
}
