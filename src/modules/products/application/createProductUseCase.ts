import { ProductRepository } from "../domain/productRepositoryInterface";
import { Product } from "../domain/productInterface";

/**
 * Use Case: Create new product
 * Used by store owner to add products to inventory
 */
export class CreateProductUseCase {
  constructor(private readonly productRepo: ProductRepository) { }

  async execute(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    // Validate product data
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error("Product name is required");
    }

    if (productData.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (productData.stock_quantity < 0) {
      throw new Error("Stock cannot be negative");
    }

    return await this.productRepo.createProduct(productData);
  }
}
