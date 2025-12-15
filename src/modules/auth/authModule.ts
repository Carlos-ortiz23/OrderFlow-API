import { Router } from "express";
import { SupabaseAuthRepository } from "./infrastructure/database/supabaseAuthRepository";
import { AuthService } from "./application/authService";
import { AuthController } from "./infrastructure/authController";
import { BcryptPasswordHasher } from "./infrastructure/services/BcryptPasswordHasher";
import { JwtTokenService } from "./infrastructure/services/JwtTokenService";
import { AuthValidator } from "./domain/validators/AuthValidator";
import { authMiddleware } from "../../middlewares/authMiddleware";

const authRouter = Router();

const authRepository = new SupabaseAuthRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const validator = new AuthValidator();

const authService = new AuthService(
    authRepository,
    passwordHasher,
    tokenService,
    validator
);

const authController = new AuthController(authService);

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/verify", authController.verifyToken);
authRouter.post("/refresh", authController.refreshToken);
authRouter.get("/profile", authMiddleware, authController.getProfile);

export { authRouter, authService };
