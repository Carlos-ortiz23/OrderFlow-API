import { supabase } from "../../config/supabase";
import { SupabaseOrderRepository } from "../../modules/orders/infrastructure/database/supabaseOrderRepository";
import { Order } from "../../modules/orders/domain/orderInterface";
import { OrderStatus } from "../../modules/common/constants";
// Valid UUID generator
import { randomUUID } from "crypto";

const generateId = () => randomUUID();

const orderRepo = new SupabaseOrderRepository();

describe("Order Flow Integration", () => {
    let storeId: string;
    let clientId: string;
    let productId: string;
    let orderId: string;

    beforeAll(async () => {
        // 1. Create Test Store
        const { data: store } = await supabase.from("stores").insert({
            name: "Test Store",
            slug: `test-store-${generateId()}`,
            is_active: true
        }).select("id").single();
        storeId = store!.id;

        // 2. Create Test Client
        const { data: client } = await supabase.from("clients").insert({
            store_id: storeId,
            telegram_id: 123456789,
            first_name: "Test",
            username: "testuser"
        }).select("id").single();
        clientId = client!.id;

        // 3. Create Test Product
        const { data: product } = await supabase.from("products").insert({
            store_id: storeId,
            name: "Test Product",
            price: 100,
            stock_quantity: 10,
            sku: `TEST-${generateId()}`
        }).select("id").single();
        productId = product!.id;
    });

    afterAll(async () => {
        // Cleanup
        if (orderId) await supabase.from("orders").delete().eq("id", orderId);
        if (productId) await supabase.from("products").delete().eq("id", productId);
        if (clientId) await supabase.from("clients").delete().eq("id", clientId);
        if (storeId) await supabase.from("stores").delete().eq("id", storeId);
    });

    it("should create a valid order and reduce stock", async () => {
        const order = new Order(
            storeId,
            clientId,
            [
                {
                    productId: productId,
                    productName: "Test Product",
                    quantity: 2,
                    unitPrice: 100
                }
            ],
            200, // Total
            "pending"
        );

        orderId = await orderRepo.createOrder(order);
        expect(orderId).toBeDefined();

        // Verify DB Status
        const savedOrder = await orderRepo.getOrderById(orderId);
        expect(savedOrder).not.toBeNull();
        expect(savedOrder?.status).toBe("pending"); // Should match Code from order_statuses
        expect(savedOrder?.total).toBe(200);

        // Verify Stock Reduction
        const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", productId)
            .single();
        expect(product?.stock_quantity).toBe(8); // 10 - 2
    });

    it("should fetch orders by status", async () => {
        const orders = await orderRepo.getOrdersByStatus(OrderStatus.PENDING, 10, 0, storeId);
        expect(orders.length).toBeGreaterThanOrEqual(1);
        expect(orders[0].status).toBe(OrderStatus.PENDING);
    });
});
