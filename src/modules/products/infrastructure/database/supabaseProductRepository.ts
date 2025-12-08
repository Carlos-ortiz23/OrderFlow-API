import { supabase } from "../../../../config/supabase";
import { Product } from "../../domain/productInterface";
import { ProductRepository } from "../../domain/productRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseProductRepository implements ProductRepository {
  // Tool 1: Search products (so the AI knows prices and stock)
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${query}%`) // Flexible search (e.g.: "rice" finds "White Rice")
      .gt("stock", 0) // Only show what's available
      .limit(5);

    if (error) {
      logger.error("Error searching products", { error, query });
      return [];
    }

    return data || [];
  }

  // Tool 2: Get exact product (to calculate total when purchasing)
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

}
