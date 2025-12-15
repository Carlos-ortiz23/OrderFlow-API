import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { supabase } from "../../config/supabase";
import { authRouter } from "../../modules/auth/authModule";

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

const generateEmail = () => `auth-test-${randomUUID()}@example.com`;

describe("Authentication Integration", () => {
    const password = "SecurePassword123";
    let email: string;

    afterAll(async () => {
        if (email) {
            await supabase.from("users").delete().eq("email", email);
        }
    });

    it("POST /auth/register - should register a new user and return tokens", async () => {
        email = generateEmail();

        const res = await request(app)
            .post("/auth/register")
            .send({ email, password, full_name: "Auth Test User" });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("user");
        expect(res.body.data.user).toHaveProperty("email", email);
        expect(res.body.data).toHaveProperty("tokens");
        expect(res.body.data.tokens).toHaveProperty("accessToken");
    });

    it("POST /auth/login - should login and return tokens", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({ email, password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("user");
        expect(res.body.data.user).toHaveProperty("email", email);
        expect(res.body.data).toHaveProperty("tokens");
        expect(res.body.data.tokens).toHaveProperty("accessToken");
        expect(res.body.data.tokens).toHaveProperty("refreshToken");
    });

    it("GET /auth/profile - should return 401 without token", async () => {
        const res = await request(app).get("/auth/profile");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("GET /auth/profile - should return user profile with valid token", async () => {
        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email, password });

        const token: string = loginRes.body.data.tokens.accessToken;

        const res = await request(app)
            .get("/auth/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("email", email);
    });

    it("POST /auth/refresh - should refresh tokens with refresh token", async () => {
        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email, password });

        const refreshToken: string = loginRes.body.data.tokens.refreshToken;

        const res = await request(app)
            .post("/auth/refresh")
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("tokens");
        expect(res.body.data.tokens).toHaveProperty("accessToken");
        expect(res.body.data.tokens).toHaveProperty("refreshToken");
    });
});
