import { supabase } from "../../../../config/supabase";
import { Order, OrderItemDetail } from "../../domain/orderInterface";
import { OrderRepository } from "../../domain/orderRepositoryInterface";
import { logger } from "../../../../utils/logger";
import { OrderStatus } from "../../../common/constants";

export class SupabaseOrderRepository implements OrderRepository {
  /**
   * Helper to get status ID from code
   */
  private async getStatusId(code: string): Promise<number | null> {
    const { data, error } = await supabase
      .from("order_statuses")
      .select("id")
      .eq("code", code)
      .single();
    if (error || !data) return null;
    return data.id;
  }

  /**
   * Helper to get status Code from ID
   * In a real app, we should cache this mapping.
   */
  private async getStatusCode(id: number): Promise<string> {
    const { data, error } = await supabase
      .from("order_statuses")
      .select("code")
      .eq("id", id)
      .single();
    if (error || !data) return "pending"; // Default fallback
    return data.code;
  }

  /**
   * Creates a complete order with stock validation and automatic reduction
   */
  async createOrder(order: Order): Promise<string> {
    try {
      // 1. Validate available stock for all products BEFORE creating the order
      for (const item of order.items) {
        const { data: product, error } = await supabase
          .from("products")
          .select("stock_quantity, price, name, store_id")
          .eq("id", item.productId)
          .eq("store_id", order.storeId)
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

        // Update item details with snapshot data
        item.unitPrice = product.price;
        item.productName = product.name;
      }

      // 2. Get Status ID for 'pending'
      const pendingStatusId = await this.getStatusId(OrderStatus.PENDING) || 1;

      // 3. Insert Header (orders table)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: order.storeId,
          client_id: order.userId, // Maps domain 'userId' (client) to DB 'client_id'
          status_id: pendingStatusId,
          total_amount: order.total,
          // payment_method_id: ... (Assuming undefined or null for now until payment flow is added)
        })
        .select("id")
        .single();

      if (orderError || !orderData) {
        logger.error("Error creating order", { error: orderError, userId: order.userId });
        throw new Error("Error saving order to database");
      }

      const orderId = orderData.id;

      // 4. Prepare the Items
      const itemsToInsert = order.items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name_snapshot: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      // 5. Insert Details (order_items table)
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        logger.error("Error inserting items", { error: itemsError, orderId });
        await this.rollbackOrder(orderId);
        throw new Error("Error saving order items");
      }

      // 6. Reduce stock
      for (const item of order.items) {
        const { error: stockError } = await supabase.rpc("reduce_product_stock", {
          product_id: item.productId,
          quantity_to_reduce: item.quantity,
        });

        if (stockError) {
          logger.error("Error reducing stock", { error: stockError, productId: item.productId, orderId });
          // If stock reduction fails, we must rollback everything
          // Note: In production you might want soft delete or state 'cancelled' instead of hard delete
          await this.rollbackOrder(orderId);
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

  private async rollbackOrder(orderId: string) {
    try {
      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("orders").delete().eq("id", orderId);
    } catch (e) {
      logger.error("CRITICAL: Failed to rollback order", { orderId, error: e });
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_statuses ( code, label ),
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

    // Extract status code from join
    // @ts-ignore
    const statusCode = orderData.order_statuses?.code || "pending";

    return new Order(
      orderData.store_id,
      orderData.client_id,
      items,
      orderData.total_amount,
      statusCode,
      orderData.id
    );
  }

  async getAllOrders(limit: number = 50, offset: number = 0, storeId?: string): Promise<Order[]> {
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_statuses ( code ),
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

      // @ts-ignore
      const statusCode = orderData.order_statuses?.code || "pending";

      return new Order(
        orderData.store_id,
        orderData.client_id,
        items,
        orderData.total_amount,
        statusCode,
        orderData.id
      );
    });
  }

  async getOrdersByStatus(
    statusCode: string,
    limit: number = 50,
    offset: number = 0,
    storeId?: string
  ): Promise<Order[]> {
    // We filter by the relation
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_statuses!inner ( code ),
        order_items (
          product_id,
          product_name_snapshot,
          quantity,
          unit_price
        )
      `)
      .eq("order_statuses.code", statusCode)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data, error } = await query;

    if (error || !data) {
      logger.error("Error getting orders by status", { error, statusCode });
      return [];
    }

    return data.map((orderData: any) => {
      const items: OrderItemDetail[] = orderData.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }));

      // @ts-ignore
      const code = orderData.order_statuses?.code || statusCode;

      return new Order(
        orderData.store_id,
        orderData.client_id,
        items,
        orderData.total_amount,
        code,
        orderData.id
      );
    });
  }

  async updateOrderStatus(orderId: string, statusCode: string): Promise<boolean> {
    const statusId = await this.getStatusId(statusCode);

    if (!statusId) {
      logger.warn("Invalid status code", { statusCode, orderId });
      return false;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status_id: statusId, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      logger.error("Error updating order status", { error, orderId, statusCode });
      return false;
    }

    logger.info("Order status updated", { orderId, statusCode });
    return true;
  }

  async getOrderStats(storeId?: string): Promise<any> {
    // Ideally use a DB view or grouped query.
    // Fetching all rows is expensive but fine for MVP/Small scale.
    // Optimizing to fetch minimal data.
    let query = supabase
      .from("orders")
      .select(`
        total_amount, 
        created_at,
        order_statuses (code)
      `);

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data: orders, error } = await query;

    if (error || !orders) {
      logger.error("Error getting statistics", { error });
      return { total: 0 };
    }

    const today = new Date().toISOString().split("T")[0];

    const stats = {
      total: orders.length,
      pending: orders.filter((o: any) => o.order_statuses?.code === OrderStatus.PENDING).length,
      confirmed: orders.filter((o: any) => o.order_statuses?.code === OrderStatus.CONFIRMED).length,
      shipped: orders.filter((o: any) => o.order_statuses?.code === OrderStatus.SHIPPED).length,
      cancelled: orders.filter((o: any) => o.order_statuses?.code === OrderStatus.CANCELLED).length,
      todayTotal: orders.filter((o: any) => o.created_at.startsWith(today)).length,
      todayRevenue: orders
        .filter((o: any) => o.created_at.startsWith(today) && o.order_statuses?.code !== OrderStatus.CANCELLED)
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0),
    };

    return stats;
  }
}
