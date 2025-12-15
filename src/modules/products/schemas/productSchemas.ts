import { z } from "zod";

/**
 * Schema for creating a new product
 */
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().positive("Price must be a positive number"),
    stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot be negative"),
    unit: z.string().min(1, "Unit is required"),
    category: z.string().optional(),
  }),
});

/**
 * Schema for updating a product
 */
export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
  body: z.object({
    name: z.string().min(1, "Product name cannot be empty").optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be a positive number").optional(),
    stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot be negative").optional(),
    unit: z.string().min(1, "Unit cannot be empty").optional(),
    category: z.string().optional(),
  }),
});

/**
 * Schema for getting a product by ID
 */
export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
});

/**
 * Schema for deleting a product
 */
export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
});

/**
 * Schema for searching products
 */
export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required"),
    storeId: z.string().uuid("Invalid store ID format"),
  }),
});

/**
 * Schema for getting all products with pagination
 */
export const getAllProductsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    offset: z.string().regex(/^\d+$/, "Offset must be a number").optional(),
    storeId: z.string().uuid("Invalid store ID format"),
  }),
});
