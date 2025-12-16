/**
 * Jest Environment Setup
 * 
 * This file loads environment variables for integration tests.
 * It uses the real .env file to connect to Supabase and other services.
 * 
 * IMPORTANT: Integration tests require a real database connection.
 * Make sure your .env file has valid credentials before running tests.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

// Override NODE_ENV for tests
process.env.NODE_ENV = "test";

// Use a different port for tests to avoid conflicts
process.env.PORT = process.env.PORT || "3001";

// Reduce bcrypt rounds for faster tests
process.env.BCRYPT_SALT_ROUNDS = "4";
