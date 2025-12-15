import { Router } from "express";
import { ProductController } from "./infrastructure/productController";
import { CategoryController } from "./infrastructure/categoryController";
import { TagController } from "./infrastructure/tagController";
import { SupabaseProductRepository } from "./infrastructure/database/supabaseProductRepository";
import { SupabaseCategoryRepository } from "./infrastructure/database/supabaseCategoryRepository";
import { SupabaseTagRepository } from "./infrastructure/database/supabaseTagRepository";

// Product use cases
import { SearchProductsUseCase } from "./application/searchProductsUseCase";
import { GetProductByIdUseCase } from "./application/getProductByIdUseCase";
import { GetAllProductsUseCase } from "./application/getAllProductsUseCase";
import { CreateProductUseCase } from "./application/createProductUseCase";
import { UpdateProductUseCase } from "./application/updateProductUseCase";
import { DeleteProductUseCase } from "./application/deleteProductUseCase";

// Category use cases
import { CreateCategoryUseCase } from "./application/category/createCategoryUseCase";
import { GetCategoryByIdUseCase } from "./application/category/getCategoryByIdUseCase";
import { GetAllCategoriesUseCase } from "./application/category/getAllCategoriesUseCase";
import { UpdateCategoryUseCase } from "./application/category/updateCategoryUseCase";
import { DeleteCategoryUseCase } from "./application/category/deleteCategoryUseCase";
import { AddProductToCategoryUseCase } from "./application/category/addProductToCategoryUseCase";
import { RemoveProductFromCategoryUseCase } from "./application/category/removeProductFromCategoryUseCase";
import { GetProductCategoriesUseCase } from "./application/category/getProductCategoriesUseCase";
import { GetCategoryProductsUseCase } from "./application/category/getCategoryProductsUseCase";

// Tag use cases
import { CreateTagUseCase } from "./application/tag/createTagUseCase";
import { GetTagByIdUseCase } from "./application/tag/getTagByIdUseCase";
import { GetAllTagsUseCase } from "./application/tag/getAllTagsUseCase";
import { UpdateTagUseCase } from "./application/tag/updateTagUseCase";
import { DeleteTagUseCase } from "./application/tag/deleteTagUseCase";
import { AddProductToTagUseCase } from "./application/tag/addProductToTagUseCase";
import { RemoveProductFromTagUseCase } from "./application/tag/removeProductFromTagUseCase";
import { GetProductTagsUseCase } from "./application/tag/getProductTagsUseCase";
import { GetTagProductsUseCase } from "./application/tag/getTagProductsUseCase";

import { validateRequest } from "../../middlewares/validateRequest";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { verifyStoreAccess } from "../../middlewares/storeAuthMiddleware";
import { telegramBotAuthMiddleware, telegramBotQueryAuthMiddleware } from "../../middlewares/telegramBotAuthMiddleware";
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  searchProductsSchema,
  getAllProductsSchema,
} from "./schemas/productSchemas";

// Instantiate repositories
const productRepo = new SupabaseProductRepository();
const categoryRepo = new SupabaseCategoryRepository();
const tagRepo = new SupabaseTagRepository();

// Instantiate product use cases
const searchProductsUseCase = new SearchProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);
const getAllProductsUseCase = new GetAllProductsUseCase(productRepo);
const createProductUseCase = new CreateProductUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(productRepo);
const deleteProductUseCase = new DeleteProductUseCase(productRepo);

// Instantiate category use cases
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);
const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryRepo);
const getAllCategoriesUseCase = new GetAllCategoriesUseCase(categoryRepo);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepo);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepo);
const addProductToCategoryUseCase = new AddProductToCategoryUseCase(categoryRepo);
const removeProductFromCategoryUseCase = new RemoveProductFromCategoryUseCase(categoryRepo);
const getProductCategoriesUseCase = new GetProductCategoriesUseCase(categoryRepo);
const getCategoryProductsUseCase = new GetCategoryProductsUseCase(categoryRepo);

// Instantiate tag use cases
const createTagUseCase = new CreateTagUseCase(tagRepo);
const getTagByIdUseCase = new GetTagByIdUseCase(tagRepo);
const getAllTagsUseCase = new GetAllTagsUseCase(tagRepo);
const updateTagUseCase = new UpdateTagUseCase(tagRepo);
const deleteTagUseCase = new DeleteTagUseCase(tagRepo);
const addProductToTagUseCase = new AddProductToTagUseCase(tagRepo);
const removeProductFromTagUseCase = new RemoveProductFromTagUseCase(tagRepo);
const getProductTagsUseCase = new GetProductTagsUseCase(tagRepo);
const getTagProductsUseCase = new GetTagProductsUseCase(tagRepo);

// Instantiate controllers
const productController = new ProductController(
  searchProductsUseCase,
  getProductByIdUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase,
  getAllProductsUseCase
);

const categoryController = new CategoryController(
  createCategoryUseCase,
  getCategoryByIdUseCase,
  getAllCategoriesUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  addProductToCategoryUseCase,
  removeProductFromCategoryUseCase,
  getProductCategoriesUseCase,
  getCategoryProductsUseCase
);

const tagController = new TagController(
  createTagUseCase,
  getTagByIdUseCase,
  getAllTagsUseCase,
  updateTagUseCase,
  deleteTagUseCase,
  addProductToTagUseCase,
  removeProductFromTagUseCase,
  getProductTagsUseCase,
  getTagProductsUseCase
);

// Configure routes with validation
const router = Router();

// ===== PRODUCT ROUTES =====
// Public routes (read-only) - require store_id parameter
router.get("/products", validateRequest(getAllProductsSchema), productController.getAllProducts);
router.get("/products/search", validateRequest(searchProductsSchema), productController.searchProducts);
router.get("/products/:id", validateRequest(getProductByIdSchema), productController.getProductById);

// Protected routes - require authentication and store ownership verification
// Create product
router.post("/products", 
  authMiddleware, 
  validateRequest(createProductSchema),
  verifyStoreAccess('store_id'),
  productController.createProduct
);

// Update product
router.put("/products/:id", 
  authMiddleware, 
  validateRequest(updateProductSchema),
  verifyStoreAccess('store_id'),
  productController.updateProduct
);

// Delete product
router.delete("/products/:id", 
  authMiddleware, 
  validateRequest(deleteProductSchema),
  verifyStoreAccess('store_id'),
  productController.deleteProduct
);

// Get product categories
router.get("/products/:productId/categories", categoryController.getProductCategories);

// Get product tags
router.get("/products/:productId/tags", tagController.getProductTags);

// ===== CATEGORY ROUTES =====
// Get all categories
router.get("/categories", categoryController.getAllCategories);

// Get category by ID
router.get("/categories/:id", categoryController.getCategoryById);

// Create category
router.post("/categories", 
  authMiddleware,
  categoryController.createCategory
);

// Update category
router.put("/categories/:id", 
  authMiddleware,
  categoryController.updateCategory
);

// Delete category
router.delete("/categories/:id", 
  authMiddleware,
  categoryController.deleteCategory
);

// Get products in category
router.get("/categories/:categoryId/products", categoryController.getCategoryProducts);

// Add product to category
router.post("/categories/:categoryId/products/:productId", 
  authMiddleware,
  categoryController.addProductToCategory
);

// Remove product from category
router.delete("/categories/:categoryId/products/:productId", 
  authMiddleware,
  categoryController.removeProductFromCategory
);

// ===== TAG ROUTES =====
// Get all tags
router.get("/tags", tagController.getAllTags);

// Get tag by ID
router.get("/tags/:id", tagController.getTagById);

// Create tag
router.post("/tags", 
  authMiddleware,
  tagController.createTag
);

// Update tag
router.put("/tags/:id", 
  authMiddleware,
  tagController.updateTag
);

// Delete tag
router.delete("/tags/:id", 
  authMiddleware,
  tagController.deleteTag
);

// Get products with tag
router.get("/tags/:tagId/products", tagController.getTagProducts);

// Add product to tag
router.post("/tags/:tagId/products/:productId", 
  authMiddleware,
  tagController.addProductToTag
);

// Remove product from tag
router.delete("/tags/:tagId/products/:productId", 
  authMiddleware,
  tagController.removeProductFromTag
);

// Bot routes - authenticated with bot token
// These routes are for the Telegram bot to access products
const botRouter = Router();
botRouter.get("/bot/products", telegramBotAuthMiddleware, productController.getAllProducts);
botRouter.get("/bot/products/:id", telegramBotAuthMiddleware, productController.getProductById);
botRouter.get("/bot/categories", telegramBotAuthMiddleware, categoryController.getAllCategories);
botRouter.get("/bot/categories/:id/products", telegramBotAuthMiddleware, categoryController.getCategoryProducts);
botRouter.get("/bot/tags", telegramBotAuthMiddleware, tagController.getAllTags);
botRouter.get("/bot/tags/:id/products", telegramBotAuthMiddleware, tagController.getTagProducts);

// Add bot routes to main router
router.use(botRouter);

export class ProductModule {
  static get routes(): Router {
    return router;
  }

  static get productRepository(): SupabaseProductRepository {
    return productRepo;
  }

  static get categoryRepository(): SupabaseCategoryRepository {
    return categoryRepo;
  }

  static get tagRepository(): SupabaseTagRepository {
    return tagRepo;
  }
}
