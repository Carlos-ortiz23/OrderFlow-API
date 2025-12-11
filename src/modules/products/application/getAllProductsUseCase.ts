import { ProductRepository } from "../domain/productRepositoryInterface";
import { Product } from "../domain/productInterface";

/**
 * Use Case: Get all products with pagination
 * Used by store owner to view entire inventory
 */
export class GetAllProductsUseCase {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(limit: number = 50, offset: number = 0): Promise<Product[]> {
    return await this.productRepo.getAllProducts(limit, offset);
  }
}
