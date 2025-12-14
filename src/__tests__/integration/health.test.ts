import request from "supertest";
import express from "express";
import { HealthController } from "../../modules/health/healthController";

const app = express();
app.get("/health", HealthController.basic);

describe("Health Check Integration", () => {
    it("GET /health - should return 200 OK", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("status", "OK");
        expect(res.body).toHaveProperty("timestamp");
    });
});
