import { ProductRepository } from "../domain/productRepositoryInterface";

/**
 * Use Case: Update product information
 * Used by store owner to modify product details (price, stock, etc.)
 */
export class UpdateProductUseCase {
  constructor(private readonly productRepo: ProductRepository) { }

  async execute(id: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
  }>): Promise<boolean> {
    // Validate updates
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (updates.stock_quantity !== undefined && updates.stock_quantity < 0) {
      throw new Error("Stock cannot be negative");
    }

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("Product name cannot be empty");
    }

    return await this.productRepo.updateProduct(id, updates);
  }
}
