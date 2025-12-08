import { supabase } from "../../../../config/supabase";
import { Order, OrderItemDetail } from "../../domain/orderInterface";
import { OrderRepository } from "../../domain/orderRepositoryInterface";
import { logger } from "../../../../utils/logger";

export class SupabaseOrderRepository implements OrderRepository {
  /**
   * Creates a complete order with stock validation and automatic reduction
   */
  async createOrder(order: Order): Promise<string> {
    try {
      // 1. Validate available stock for all products BEFORE creating the order
      for (const item of order.items) {
        const { data: product, error } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.productId)
          .single();

        if (error || !product) {
          throw new Error(`Product ${item.productName} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.productName}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Insert Header (orders table)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: order.userId,
          status: "confirmed",
          total_amount: order.total,
        })
        .select("id")
        .single();

      if (orderError || !orderData) {
        logger.error("Error creating order", { error: orderError, userId: order.userId });
        throw new Error("Error saving order to database");
      }

      const orderId = orderData.id;

      // 3. Prepare the Items
      const itemsToInsert = order.items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name_snapshot: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      // 4. Insert Details (order_items table)
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        logger.error("Error inserting items", { error: itemsError, orderId });
        // Rollback: Try to delete the order if item insertion failed
        try {
          await supabase.from("orders").delete().eq("id", orderId);
        } catch (rollbackError) {
          logger.error("Critical error in order rollback", { error: rollbackError, orderId });
        }
        throw new Error("Error saving order items");
      }

      // 5. Reduce stock for each product
      for (const item of order.items) {
        const { error: stockError } = await supabase.rpc("reduce_product_stock", {
          product_id: item.productId,
          quantity_to_reduce: item.quantity,
        });

        if (stockError) {
          logger.error("Error reducing stock", { error: stockError, productId: item.productId, orderId });
          // Rollback: If stock reduction fails, try manual rollback
          try {
            await supabase.from("order_items").delete().eq("order_id", orderId);
            await supabase.from("orders").delete().eq("id", orderId);
          } catch (rollbackError) {
            logger.error("Critical error in complete rollback", { error: rollbackError, orderId });
          }
          throw new Error(
            `Error reducing stock for ${item.productName}. Order cancelled.`
          );
        }
      }

      return orderId;
    } catch (error) {
      logger.error("Error in createOrder", { error, userId: order.userId });
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_id,
          product_name_snapshot,
          quantity,
          unit_price
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !orderData) {
      logger.error("Error getting order", { error, orderId });
      return null;
    }

    const items: OrderItemDetail[] = orderData.order_items.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name_snapshot,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }));

    return new Order(
      orderData.user_id,
      items,
      orderData.total_amount,
      orderData.status,
      orderData.id
    );
  }

  async getAllOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_id,
          product_name_snapshot,
          quantity,
          unit_price
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      logger.error("Error getting orders", { error });
      return [];
    }

    return data.map((orderData: any) => {
      const items: OrderItemDetail[] = orderData.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }));

      return new Order(
        orderData.user_id,
        items,
        orderData.total_amount,
        orderData.status,
        orderData.id
      );
    });
  }

  async getOrdersByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_id,
          product_name_snapshot,
          quantity,
          unit_price
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      logger.error("Error getting orders by status", { error, status });
      return [];
    }

    return data.map((orderData: any) => {
      const items: OrderItemDetail[] = orderData.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }));

      return new Order(
        orderData.user_id,
        items,
        orderData.total_amount,
        orderData.status,
        orderData.id
      );
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const validStatuses = ["pending", "confirmed", "shipped", "cancelled"];
    if (!validStatuses.includes(status)) {
      logger.warn("Invalid status", { status, orderId });
      return false;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      logger.error("Error updating order status", { error, orderId, status });
      return false;
    }

    logger.info("Order status updated", { orderId, status });
    return true;
  }

  async getOrderStats(): Promise<any> {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, total_amount, created_at");

    if (error || !orders) {
      logger.error("Error getting statistics", { error });
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        cancelled: 0,
        todayTotal: 0,
        todayRevenue: 0,
      };
    }

    const today = new Date().toISOString().split("T")[0];

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      todayTotal: orders.filter((o) => o.created_at.startsWith(today)).length,
      todayRevenue: orders
        .filter((o) => o.created_at.startsWith(today) && o.status !== "cancelled")
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    };

    return stats;
  }
}
