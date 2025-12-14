import request from "supertest";
import { supabase } from "../../config/supabase";
import express from "express";
import { ProductModule } from "../../modules/products/productModule"; // Ensure this matches your export
// Valid UUID generator
import { randomUUID } from "crypto";
const generateId = () => randomUUID();

const app = express();
app.use(express.json());
app.use("/products", ProductModule.routes);

describe("Products Integration", () => {
    let storeId: string;
    let productId: string;

    beforeAll(async () => {
        // Create Test Store
        const { data: store } = await supabase.from("stores").insert({
            name: "Product Test Store",
            slug: `prod-store-${generateId()}`,
            is_active: true
        }).select("id").single();
        storeId = store!.id;

        // Create Test Product
        const { data: product } = await supabase.from("products").insert({
            store_id: storeId,
            name: "Integration Test Product",
            price: 50.00,
            stock_quantity: 100,
            sku: `PROD-${generateId()}`
        }).select("id").single();
        productId = product!.id;
    });

    afterAll(async () => {
        if (productId) await supabase.from("products").delete().eq("id", productId);
        if (storeId) await supabase.from("stores").delete().eq("id", storeId);
    });

    it("GET /products - should return list of products", async () => {
        const res = await request(app).get("/products").query({ storeId });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("GET /products/:id - should return product details", async () => {
        const res = await request(app).get(`/products/${productId}`).query({ storeId });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("id", productId);
        expect(res.body.data).toHaveProperty("name", "Integration Test Product");
    });
});
