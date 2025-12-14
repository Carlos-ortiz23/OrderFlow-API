import { supabase } from "../../../../config/supabase";
import { Product } from "../../domain/productInterface";
import { ProductRepository } from "../../domain/productRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseProductRepository implements ProductRepository {
  // Tool 1: Search products (so the AI knows prices and stock)
  async searchProducts(query: string, storeId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId) // Filter by store
      .ilike("name", `%${query}%`) // Flexible search (e.g.: "rice" finds "White Rice")
      .gt("stock_quantity", 0) // Only show what's available
      .limit(5);

    if (error) {
      logger.error("Error searching products", { error, query });
      return [];
    }

    logger.info("Products found", { count: data?.length || 0, query });
    if (data && data.length > 0) {
      logger.info("Product IDs found:", {
        products: data.map(p => ({ id: p.id, name: p.name, storeId: p.store_id }))
      });
    }

    return data || [];
  }

  // Tool 2: Get exact product (to calculate total when purchasing)
  async getProductById(id: string, storeId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId) // Verify ownership
      .single();

    if (error || !data) {
      // --- DEEP DIAGNOSTIC CHECK ---
      // Check if the product exists GLOBALLY (ignoring store_id)
      // This helps us distinguish between "Invalid ID" and "Wrong Store"
      const { data: globalData } = await supabase
        .from("products")
        .select("store_id, name")
        .eq("id", id)
        .single();

      if (globalData) {
        logger.error("CRITICAL: Product exists but store_id mismatch", {
          searchedId: id,
          expectedStore: storeId,
          actualStore: globalData.store_id,
          productName: globalData.name
        });
      } else {
        logger.warn("Diagnostic: Product ID does not exist in DB at all", { searchedId: id });
      }
      return null;
    }

    if (error) return null;
    return data;
  }

  // Get all products with pagination
  async getAllProducts(limit: number = 50, offset: number = 0, storeId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting all products", { error });
      return [];
    }

    return data || [];
  }

  // Create new product
  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select()
      .single();

    if (error) {
      logger.error("Error creating product", { error });
      throw new Error("Failed to create product");
    }

    return data;
  }

  // Update existing product
  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) {
      logger.error("Error updating product", { error, id });
      return false;
    }

    return true;
  }

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Error deleting product", { error, id });
      return false;
    }

    return true;
  }
}
