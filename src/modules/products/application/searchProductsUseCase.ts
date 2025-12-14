import { ProductRepository } from "../domain/productRepositoryInterface";
import { Product } from "../domain/productInterface";
import { logger } from "../../../utils/logger";

export class SearchProductsUseCase {
  constructor(private readonly productRepo: ProductRepository) { }

  async execute(query: string, storeId: string): Promise<Product[]> {
    try {
      if (!query || query.trim().length === 0) {
        logger.warn("Product search with empty query");
        return [];
      }

      logger.debug("Searching products", { query, storeId });
      const products = await this.productRepo.searchProducts(query, storeId);

      logger.info("Products found", { query, count: products.length });
      return products;
    } catch (error) {
      logger.error("Error in SearchProductsUseCase", { error, query });
      throw error;
    }
  }
}
