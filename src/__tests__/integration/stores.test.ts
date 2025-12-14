import request from "supertest";
import { supabase } from "../../config/supabase";
import express from "express";
import { storeRouter } from "../../modules/stores/storeModule";
// Valid UUID generator
import { randomUUID } from "crypto";
const generateId = () => randomUUID();

const app = express();
app.use(express.json());
app.use("/stores", storeRouter);

describe("Stores Integration", () => {
    let storeId: string;

    beforeAll(async () => {
        // Create Test Store
        const { data } = await supabase.from("stores").insert({
            name: "API Test Store",
            slug: `api-test-${generateId()}`,
            is_active: true
        }).select("id").single();
        storeId = data!.id;
    });

    afterAll(async () => {
        if (storeId) await supabase.from("stores").delete().eq("id", storeId);
    });

    it("GET /stores/:id - should return store details", async () => {
        const res = await request(app).get(`/stores/${storeId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id", storeId);
        expect(res.body.data).toHaveProperty("name", "API Test Store");
    });

    it("GET /stores/:id - should return 404 for unknown store", async () => {
        const res = await request(app).get(`/stores/${generateId()}`);
        expect(res.status).toBe(404);
    });
});
