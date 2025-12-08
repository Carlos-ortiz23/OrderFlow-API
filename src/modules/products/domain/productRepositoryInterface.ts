import { Product } from "./productInterface";

/**
 * Product repository interface
 * Defines the contract that any product repository implementation must fulfill
 */
export interface ProductRepository {
  /**
   * Search for products by search term
   * @param query - Search term
   * @returns List of products that match the search
   */
  searchProducts(query: string): Promise<Product[]>;

  /**
   * Get a product by its ID
   * @param id - Product ID
   * @returns The found product or null if it doesn't exist
   */
  getProductById(id: string): Promise<Product | null>;
}
