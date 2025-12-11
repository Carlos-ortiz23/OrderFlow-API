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

router.get("/", validateRequest(getAllProductsSchema), controller.getAllProducts);
router.get("/search", validateRequest(searchProductsSchema), controller.searchProducts);
router.get("/:id", validateRequest(getProductByIdSchema), controller.getProductById);
router.post("/", validateRequest(createProductSchema), controller.createProduct);
router.put("/:id", validateRequest(updateProductSchema), controller.updateProduct);
router.delete("/:id", validateRequest(deleteProductSchema), controller.deleteProduct);

export class ProductModule {
  static get routes(): Router {
    return router;
  }

  static get repository(): SupabaseProductRepository {
    return productRepo;
  }
}
