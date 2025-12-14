import { ProductRepository } from "../domain/productRepositoryInterface";
import { Product } from "../domain/productInterface";
import { logger } from "../../../utils/logger";

export class GetProductByIdUseCase {
  constructor(private readonly productRepo: ProductRepository) { }

  async execute(id: string, storeId: string): Promise<Product | null> {
    try {
      logger.debug("Getting product by ID", { id, storeId });
      const product = await this.productRepo.getProductById(id, storeId);

      if (!product) {
        logger.warn("Product not found", { id });
      }

      return product;
    } catch (error) {
      logger.error("Error in GetProductByIdUseCase", { error, id });
      throw error;
    }
  }
}
