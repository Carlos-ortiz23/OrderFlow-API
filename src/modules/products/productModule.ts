import { Router } from "express";
import { ProductController } from "./infrastructure/productController";
import { SupabaseProductRepository } from "./infrastructure/database/supabaseProductRepository";
import { SearchProductsUseCase } from "./application/searchProductsUseCase";
import { GetProductByIdUseCase } from "./application/getProductByIdUseCase";

// Instantiate repository
const productRepo = new SupabaseProductRepository();

// Instantiate use cases
const searchProductsUseCase = new SearchProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);

// Instantiate controller
const controller = new ProductController(
  searchProductsUseCase,
  getProductByIdUseCase
);

// Configure routes
const router = Router();

router.get("/search", controller.searchProducts);
router.get("/:id", controller.getProductById);

export class ProductModule {
  static get routes(): Router {
    return router;
  }

  static get repository(): SupabaseProductRepository {
    return productRepo;
  }
}
