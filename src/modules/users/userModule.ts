import { Router } from "express";
import { SupabaseUserRepository } from "./infrastructure/database/supabaseUserRepository";

const userRouter = Router();
const userRepo = new SupabaseUserRepository();

// No public endpoints for now, just internal usage or future admin endpoints.

export { userRouter };
