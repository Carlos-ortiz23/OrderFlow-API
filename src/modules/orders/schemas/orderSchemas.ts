import { z } from "zod";

/**
 * Valid order statuses
 */
const orderStatusEnum = z.enum(["pending", "confirmed", "in_transit"]);

/**
 * Schema for getting an order by ID
 */
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid order ID format"),
  }),
});

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid order ID format"),
  }),
  body: z.object({
    status: orderStatusEnum,
  }),
});

/**
 * Schema for getting orders with filters
 */
export const getOrdersSchema = z.object({
  query: z.object({
    status: orderStatusEnum.optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
    offset: z.string().regex(/^\d+$/, "Offset must be a number").optional(),
  }),
});
