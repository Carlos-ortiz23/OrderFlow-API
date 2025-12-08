import { ProductRepository } from "../domain/productRepositoryInterface";
import { Product } from "../domain/productInterface";
import { logger } from "../../../utils/logger";

export class GetProductByIdUseCase {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(id: string): Promise<Product | null> {
    try {
      logger.debug("Getting product by ID", { id });
      const product = await this.productRepo.getProductById(id);
      
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
