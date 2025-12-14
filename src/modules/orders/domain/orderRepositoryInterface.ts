import { Order } from "./orderInterface";

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  cancelled: number;
  todayTotal: number;
  todayRevenue: number;
}

export interface OrderRepository {
  createOrder(order: Order): Promise<string>;
  getOrderById(orderId: string): Promise<Order | null>;
  getAllOrders(limit?: number, offset?: number, storeId?: string): Promise<Order[]>;
  getOrdersByStatus(status: string, limit?: number, offset?: number, storeId?: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string): Promise<boolean>;
  getOrderStats(storeId?: string): Promise<OrderStats>;
}
