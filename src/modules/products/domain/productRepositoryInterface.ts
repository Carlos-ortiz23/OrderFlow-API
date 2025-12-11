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

  /**
   * Get all products with pagination
   * @param limit - Maximum number of products to return
   * @param offset - Number of products to skip
   * @returns List of products
   */
  getAllProducts(limit: number, offset: number): Promise<Product[]>;

  /**
   * Create a new product
   * @param product - Product data without id and created_at
   * @returns The created product
   */
  createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product>;

  /**
   * Update an existing product
   * @param id - Product ID
   * @param updates - Fields to update
   * @returns True if updated successfully
   */
  updateProduct(id: string, updates: Partial<Product>): Promise<boolean>;

  /**
   * Delete a product
   * @param id - Product ID
   * @returns True if deleted successfully
   */
  deleteProduct(id: string): Promise<boolean>;
}
