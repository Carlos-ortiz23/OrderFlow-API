process.env.NODE_ENV = process.env.NODE_ENV || "test";

process.env.PORT = process.env.PORT || "3001";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || "test-supabase-key";

process.env.LLM_API_KEY = process.env.LLM_API_KEY || "test-llm-key";
process.env.LLM_MODEL = process.env.LLM_MODEL || "test-model";
process.env.LLM_URL = process.env.LLM_URL || "http://localhost:1234";

process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-telegram-bot-token";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || "15m";
process.env.JWT_REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION || "1h";

process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || "4";
