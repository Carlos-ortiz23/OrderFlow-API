import { Router } from "express";
import { ProductController } from "./infrastructure/productController";
import { SupabaseProductRepository } from "./infrastructure/database/supabaseProductRepository";
import { SearchProductsUseCase } from "./application/searchProductsUseCase";
import { GetProductByIdUseCase } from "./application/getProductByIdUseCase";
import { GetAllProductsUseCase } from "./application/getAllProductsUseCase";
import { CreateProductUseCase } from "./application/createProductUseCase";
import { UpdateProductUseCase } from "./application/updateProductUseCase";
import { DeleteProductUseCase } from "./application/deleteProductUseCase";
import { validateRequest } from "../../middlewares/validateRequest";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { verifyStoreAccess, extractStoreIdAndVerifyAccess } from "../../middlewares/storeAuthMiddleware";
import { telegramBotAuthMiddleware, telegramBotQueryAuthMiddleware } from "../../middlewares/telegramBotAuthMiddleware";
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  searchProductsSchema,
  getAllProductsSchema,
} from "./schemas/productSchemas";

// Instantiate repository
const productRepo = new SupabaseProductRepository();

// Instantiate use cases
const searchProductsUseCase = new SearchProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);
const getAllProductsUseCase = new GetAllProductsUseCase(productRepo);
const createProductUseCase = new CreateProductUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(productRepo);
const deleteProductUseCase = new DeleteProductUseCase(productRepo);

// Instantiate controller
const controller = new ProductController(
  searchProductsUseCase,
  getProductByIdUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase,
  getAllProductsUseCase
);

// Configure routes with validation
const router = Router();

// Public routes (read-only) - require store_id parameter
router.get("/", validateRequest(getAllProductsSchema), controller.getAllProducts);
router.get("/search", validateRequest(searchProductsSchema), controller.searchProducts);
router.get("/:id", validateRequest(getProductByIdSchema), controller.getProductById);

// Protected routes - require authentication and store ownership verification
// Create product
router.post("/", 
  authMiddleware, 
  validateRequest(createProductSchema),
  extractStoreIdAndVerifyAccess,
  controller.createProduct
);

// Update product
router.put("/:id", 
  authMiddleware, 
  validateRequest(updateProductSchema),
  extractStoreIdAndVerifyAccess,
  controller.updateProduct
);

// Delete product
router.delete("/:id", 
  authMiddleware, 
  validateRequest(deleteProductSchema),
  extractStoreIdAndVerifyAccess,
  controller.deleteProduct
);

// Bot routes - authenticated with bot token
// These routes are for the Telegram bot to access products
const botRouter = Router();
botRouter.get("/bot/products", telegramBotAuthMiddleware, controller.getAllProducts);
botRouter.get("/bot/products/:id", telegramBotAuthMiddleware, controller.getProductById);

// Add bot routes to main router
router.use(botRouter);

export class ProductModule {
  static get routes(): Router {
    return router;
  }

  static get repository(): SupabaseProductRepository {
    return productRepo;
  }
}
