import { ProductRepository } from "../domain/productRepositoryInterface";
import { logger } from "../../../utils/logger";

/**
 * Use Case: Delete product from inventory
 * Used by store owner to remove products
 */
export class DeleteProductUseCase {
  constructor(private readonly productRepo: ProductRepository) { }

  async execute(id: string, storeId: string): Promise<boolean> {
    // Check if product exists before deleting
    const product = await this.productRepo.getProductById(id, storeId);

    if (!product) {
      logger.warn("Attempted to delete non-existent product", { productId: id });
      return false;
    }

    const deleted = await this.productRepo.deleteProduct(id);

    if (deleted) {
      logger.info("Product deleted successfully", {
        productId: id,
        productName: product.name
      });
    }

    return deleted;
  }
}
