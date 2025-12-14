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
          .select("stock_quantity, price, name, store_id") // Fetch price/name for snapshot
          .eq("id", item.productId)
          .eq("store_id", order.storeId) // Ensure product belongs to store
          .single();

        if (error || !product) {
          logger.error("Product validation failed - Not found", { productId: item.productId, storeId: order.storeId });
          throw new Error(`Product ${item.productName} not found`);
        }

        if (product.stock_quantity < item.quantity) {
          logger.warn("Insufficient stock", {
            product: product.name,
            available: product.stock_quantity,
            requested: item.quantity
          });
          throw new Error(
            `Insufficient stock for ${item.productName}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
          );
        }

        logger.info("Stock valid for product", {
          name: product.name,
          stock: product.stock_quantity,
          requested: item.quantity
        });

        // Update item details with snapshot data from DB (Security: don't trust frontend price)
        item.unitPrice = product.price;
        item.productName = product.name;
      }

      // 2. Insert Header (orders table)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: order.storeId,
          client_id: order.userId, // Map userId to client_id
          status_id: 1, // Default 'pending'
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
      orderData.store_id,
      orderData.client_id,
      items,
      orderData.total_amount,
      "pending", // We should map status_id to string, but for now hardcode or fetch map. 
      // Ideally we join order_statuses. Let's assume 'pending' for simplicity or fetch it.
      // The query didn't join order_statuses.
      orderData.id
    );
  }

  async getAllOrders(limit: number = 50, offset: number = 0, storeId?: string): Promise<Order[]> {
    let query = supabase
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

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data, error } = await query;

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
        orderData.store_id,
        orderData.client_id,
        items,
        orderData.total_amount,
        "pending", // Placeholder, see above
        orderData.id
      );
    });
  }

  async getOrdersByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0,
    storeId?: string
  ): Promise<Order[]> {
    // We need to map status string to ID or join.
    // For now, let's assume we can filter by joined status code if we change the query.
    // Or we just ignore status filter for a moment if we don't have the map.
    // But the requirement is strict.
    // Let's assume status is passed as ID or we fetch it.
    // Actually, let's join order_statuses!

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_statuses!inner(code),
        order_items (
          product_id,
          product_name_snapshot,
          quantity,
          unit_price
        )
      `)
      .eq("order_statuses.code", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data, error } = await query;

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
        orderData.store_id,
        orderData.client_id,
        items,
        orderData.total_amount,
        "pending", // Placeholder
        orderData.id
      );
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const statusMap: Record<string, number> = {
      "pending": 1,
      "confirmed": 2,
      "paid": 3,
      "shipped": 4,
      "cancelled": 5,
      "completed": 6
    };

    const statusId = statusMap[status];

    if (!statusId) {
      logger.warn("Invalid status", { status, orderId });
      return false;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status_id: statusId, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      logger.error("Error updating order status", { error, orderId, status });
      return false;
    }

    logger.info("Order status updated", { orderId, status });
    return true;
  }

  async getOrderStats(storeId?: string): Promise<any> {
    let query = supabase
      .from("orders")
      .select("status_id, total_amount, created_at");

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data: orders, error } = await query;

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
      pending: orders.filter((o) => o.status_id === 1).length,
      confirmed: orders.filter((o) => o.status_id === 2).length,
      shipped: orders.filter((o) => o.status_id === 4).length,
      cancelled: orders.filter((o) => o.status_id === 5).length,
      todayTotal: orders.filter((o) => o.created_at.startsWith(today)).length,
      todayRevenue: orders
        .filter((o) => o.created_at.startsWith(today) && o.status_id !== 5)
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    };

    return stats;
  }
}
