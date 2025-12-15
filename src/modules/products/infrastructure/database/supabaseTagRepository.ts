import { supabase } from "../../../../config/supabase";
import { Tag } from "../../domain/tagInterface";
import { TagRepository, CreateTagData, UpdateTagData } from "../../domain/tagRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseTagRepository implements TagRepository {
  async createTag(data: CreateTagData): Promise<Tag> {
    try {
      const { data: tag, error } = await supabase
        .from("tags")
        .insert({
          store_id: data.store_id,
          name: data.name
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating tag", { error, data });
        throw new Error(`Error creating tag: ${error.message}`);
      }

      return tag as Tag;
    } catch (error) {
      logger.error("Unexpected error creating tag", { error });
      throw new Error("Failed to create tag");
    }
  }

  async getTagById(id: string, storeId: string): Promise<Tag | null> {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select(`
          *,
          product_count:product_tags(count)
        `)
        .eq("id", id)
        .eq("store_id", storeId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Tag not found
        }
        logger.error("Error getting tag by ID", { error, id, storeId });
        throw new Error(`Error getting tag: ${error.message}`);
      }

      return data as Tag;
    } catch (error) {
      logger.error("Unexpected error getting tag", { error, id });
      throw new Error("Failed to get tag");
    }
  }

  async getAllTags(storeId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .rpc("get_store_tags", { p_store_id: storeId });

      if (error) {
        logger.error("Error getting all tags", { error, storeId });
        throw new Error(`Error getting tags: ${error.message}`);
      }

      return data as Tag[];
    } catch (error) {
      logger.error("Unexpected error getting tags", { error, storeId });
      throw new Error("Failed to get tags");
    }
  }

  async updateTag(id: string, data: UpdateTagData): Promise<Tag | null> {
    try {
      const { data: tag, error } = await supabase
        .from("tags")
        .update({
          name: data.name
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating tag", { error, id, data });
        throw new Error(`Error updating tag: ${error.message}`);
      }

      return tag as Tag;
    } catch (error) {
      logger.error("Unexpected error updating tag", { error, id });
      throw new Error("Failed to update tag");
    }
  }

  async deleteTag(id: string, storeId: string): Promise<boolean> {
    try {
      // First verify the tag belongs to the store (security check)
      const { data: tag, error: fetchError } = await supabase
        .from("tags")
        .select("id")
        .eq("id", id)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !tag) {
        if (fetchError?.code === "PGRST116") {
          return false; // Tag not found
        }
        logger.error("Error verifying tag ownership", { error: fetchError, id, storeId });
        throw new Error(`Error verifying tag ownership: ${fetchError?.message}`);
      }

      // Delete the tag
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting tag", { error, id });
        throw new Error(`Error deleting tag: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error deleting tag", { error, id });
      throw new Error("Failed to delete tag");
    }
  }

  async addProductToTag(productId: string, tagId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("product_tags")
        .insert({
          product_id: productId,
          tag_id: tagId
        });

      if (error) {
        // If the error is a duplicate key error, the product is already tagged
        if (error.code === "23505") {
          return true;
        }
        logger.error("Error adding product to tag", { error, productId, tagId });
        throw new Error(`Error adding product to tag: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error adding product to tag", { error, productId, tagId });
      throw new Error("Failed to add product to tag");
    }
  }

  async removeProductFromTag(productId: string, tagId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("product_tags")
        .delete()
        .eq("product_id", productId)
        .eq("tag_id", tagId);

      if (error) {
        logger.error("Error removing product from tag", { error, productId, tagId });
        throw new Error(`Error removing product from tag: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error removing product from tag", { error, productId, tagId });
      throw new Error("Failed to remove product from tag");
    }
  }

  async getProductTags(productId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .rpc("get_product_tags", { p_product_id: productId });

      if (error) {
        logger.error("Error getting product tags", { error, productId });
        throw new Error(`Error getting product tags: ${error.message}`);
      }

      return data as Tag[];
    } catch (error) {
      logger.error("Unexpected error getting product tags", { error, productId });
      throw new Error("Failed to get product tags");
    }
  }

  async getTagProducts(tagId: string, storeId: string): Promise<any[]> {
    try {
      // First verify the tag belongs to the store (security check)
      const { data: tag, error: fetchError } = await supabase
        .from("tags")
        .select("id")
        .eq("id", tagId)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !tag) {
        if (fetchError?.code === "PGRST116") {
          return []; // Tag not found
        }
        logger.error("Error verifying tag ownership", { error: fetchError, tagId, storeId });
        throw new Error(`Error verifying tag ownership: ${fetchError?.message}`);
      }

      // Get products with this tag
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
            .from("product_tags")
            .select("product_id")
            .eq("tag_id", tagId)
            .then(result => result.data?.map(item => item.product_id) || [])
        );

      if (error) {
        logger.error("Error getting tag products", { error, tagId });
        throw new Error(`Error getting tag products: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error("Unexpected error getting tag products", { error, tagId });
      throw new Error("Failed to get tag products");
    }
  }
}
