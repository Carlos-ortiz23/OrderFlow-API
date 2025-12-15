import { supabase } from "../../../../config/supabase";
import { Category } from "../../domain/categoryInterface";
import { CategoryRepository, CreateCategoryData, UpdateCategoryData } from "../../domain/categoryRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseCategoryRepository implements CategoryRepository {
  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const { data: category, error } = await supabase
        .from("categories")
        .insert({
          store_id: data.store_id,
          name: data.name,
          description: data.description || null,
          is_active: data.is_active !== undefined ? data.is_active : true
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating category", { error, data });
        throw new Error(`Error creating category: ${error.message}`);
      }

      return category as Category;
    } catch (error) {
      logger.error("Unexpected error creating category", { error });
      throw new Error("Failed to create category");
    }
  }

  async getCategoryById(id: string, storeId: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          product_count:product_categories(count)
        `)
        .eq("id", id)
        .eq("store_id", storeId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Category not found
        }
        logger.error("Error getting category by ID", { error, id, storeId });
        throw new Error(`Error getting category: ${error.message}`);
      }

      return data as Category;
    } catch (error) {
      logger.error("Unexpected error getting category", { error, id });
      throw new Error("Failed to get category");
    }
  }

  async getAllCategories(storeId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .rpc("get_store_categories", { p_store_id: storeId });

      if (error) {
        logger.error("Error getting all categories", { error, storeId });
        throw new Error(`Error getting categories: ${error.message}`);
      }

      return data as Category[];
    } catch (error) {
      logger.error("Unexpected error getting categories", { error, storeId });
      throw new Error("Failed to get categories");
    }
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category | null> {
    try {
      const { data: category, error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          description: data.description,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating category", { error, id, data });
        throw new Error(`Error updating category: ${error.message}`);
      }

      return category as Category;
    } catch (error) {
      logger.error("Unexpected error updating category", { error, id });
      throw new Error("Failed to update category");
    }
  }

  async deleteCategory(id: string, storeId: string): Promise<boolean> {
    try {
      // First verify the category belongs to the store (security check)
      const { data: category, error: fetchError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", id)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !category) {
        if (fetchError?.code === "PGRST116") {
          return false; // Category not found
        }
        logger.error("Error verifying category ownership", { error: fetchError, id, storeId });
        throw new Error(`Error verifying category ownership: ${fetchError?.message}`);
      }

      // Delete the category
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting category", { error, id });
        throw new Error(`Error deleting category: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error deleting category", { error, id });
      throw new Error("Failed to delete category");
    }
  }

  async addProductToCategory(productId: string, categoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("product_categories")
        .insert({
          product_id: productId,
          category_id: categoryId
        });

      if (error) {
        // If the error is a duplicate key error, the product is already in the category
        if (error.code === "23505") {
          return true;
        }
        logger.error("Error adding product to category", { error, productId, categoryId });
        throw new Error(`Error adding product to category: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error adding product to category", { error, productId, categoryId });
      throw new Error("Failed to add product to category");
    }
  }

  async removeProductFromCategory(productId: string, categoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("product_id", productId)
        .eq("category_id", categoryId);

      if (error) {
        logger.error("Error removing product from category", { error, productId, categoryId });
        throw new Error(`Error removing product from category: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error removing product from category", { error, productId, categoryId });
      throw new Error("Failed to remove product from category");
    }
  }

  async getProductCategories(productId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .rpc("get_product_categories", { p_product_id: productId });

      if (error) {
        logger.error("Error getting product categories", { error, productId });
        throw new Error(`Error getting product categories: ${error.message}`);
      }

      return data as Category[];
    } catch (error) {
      logger.error("Unexpected error getting product categories", { error, productId });
      throw new Error("Failed to get product categories");
    }
  }

  async getCategoryProducts(categoryId: string, storeId: string): Promise<any[]> {
    try {
      // First verify the category belongs to the store (security check)
      const { data: category, error: fetchError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !category) {
        if (fetchError?.code === "PGRST116") {
          return []; // Category not found
        }
        logger.error("Error verifying category ownership", { error: fetchError, categoryId, storeId });
        throw new Error(`Error verifying category ownership: ${fetchError?.message}`);
      }

      // Get products in the category using a join approach
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          stock_quantity,
          is_active
        `)
        .eq("is_active", true)
        .eq("store_id", storeId)
        .filter("id", "in", 
          supabase
            .from("product_categories")
            .select("product_id")
            .eq("category_id", categoryId)
            .then(result => result.data?.map(item => item.product_id) || [])
        );

      if (error) {
        logger.error("Error getting category products", { error, categoryId });
        throw new Error(`Error getting category products: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error("Unexpected error getting category products", { error, categoryId });
      throw new Error("Failed to get category products");
    }
  }
}
