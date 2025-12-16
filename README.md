# OrderFlow API

REST API built with Node.js, TypeScript, and Clean Architecture to manage orders through an intelligent Telegram chatbot. The system allows users to place product orders through natural conversation, using artificial intelligence (LLM providers) to process requests, search for products, and complete transactions automatically.

## 🎯 What is OrderFlow?

OrderFlow is a conversational commerce solution that transforms the traditional shopping experience into a natural conversation. Customers can:

- 💬 Chat with an intelligent bot on Telegram
- 🔍 Search for products using natural language
- 🛒 Add products to cart through chat
- ✅ Confirm and complete orders without forms
- 📦 Receive instant confirmation of their orders

The system maintains conversation context, validates stock availability in real-time, and processes transactions securely.

## 🏗️ Project Status

**Current Version:** MVP (Minimum Viable Product)

### ✅ Implemented Modules:
- **Bot Module**: Intelligent chatbot with AI for Telegram communication
- **Products Module**: Complete CRUD for inventory management (create, read, update, delete)
- **Orders Module**: Order management with automatic customer notifications via Telegram
- **Health Module**: API and external services status monitoring
- **Validation Module**: Automatic request validation with Zod schemas

### ✅ Recently Completed:
- **Authentication Module**: JWT-based authentication with refresh tokens
- **Stores Module**: Multi-store management for owners
- **Users Module**: User management and profiles
- **Clients Module**: Customer management for stores
- **Categories Module**: Product categorization system
- **Tags Module**: Product tagging system
- **Role-Based Access Control**: Owner, admin, manager, and viewer roles
- **Automatic Bot Creation**: Create Telegram bots automatically via BotFather API

### 🚧 Future Enhancements:
- **Admin Dashboard**: Administration panel for product and order management
- **Payment Integration**: Payment gateway integration
- **Analytics Module**: Sales and performance analytics

## 🚀 Features

### Core Features
- ✅ **Clean Architecture**: Clear separation between domain, application, and infrastructure
- ✅ **SOLID Principles**: Single Responsibility, Dependency Inversion, and more
- ✅ **TypeScript**: Strong typing for better security and maintainability
- ✅ **Dependency Injection**: Facilitates testing and implementation changes
- ✅ **Conversational AI**: Natural language processing with LLM providers (OpenAI, DeepSeek, Groq, etc.)

### Security & Authentication
- ✅ **JWT Authentication**: Secure token-based authentication with refresh tokens
- ✅ **Role-Based Access Control (RBAC)**: Owner, admin, manager, and viewer roles
- ✅ **Password Hashing**: Bcrypt with configurable salt rounds
- ✅ **Token Expiration**: Configurable access (15m) and refresh (1h) token lifetimes
- ✅ **Security Headers**: Helmet, CORS, and environment variables validation
- ✅ **Rate Limiting**: Protection against abuse and DDoS attacks

### Data & Validation
- ✅ **Data Validation**: Automatic request validation with Zod schemas
- ✅ **Custom Error Handling**: Structured error responses with proper HTTP codes
- ✅ **Input Sanitization**: Email and password validation
- ✅ **Transactions**: Transaction handling with automatic rollback

### Monitoring & Logging
- ✅ **Health Checks**: External services verification (Supabase, LLM, Telegram)
- ✅ **Professional Logging**: Log system with levels (debug, info, warn, error)
- ✅ **Error Tracking**: Global middleware with structured logging

### API & Documentation
- ✅ **RESTful API**: Well-structured REST endpoints
- ✅ **API Documentation**: Professional Swagger/OpenAPI documentation
- ✅ **Retry Logic**: Automatic retries on external API calls
- ✅ **Privacy & Security**: Bot follows strict data protection principles

### Multi-Store Management
- ✅ **Store Management**: Owners can manage multiple stores from one account
- ✅ **Store CRUD**: Create, read, update, and delete stores
- ✅ **Store Authorization**: Owners can only manage their own stores

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Supabase account
- LLM API Key (OpenAI, DeepSeek, Groq, etc.)
- Telegram Bot

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/Carlos-ortiz23/OrderFlow-API.git
cd OrderFlow-API
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# LLM Configuration (OpenAI, DeepSeek, Groq, etc.)
LLM_API_KEY=your-llm-api-key
LLM_MODEL=deepseek-chat
LLM_URL=https://api.deepseek.com

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Telegram Bot Creation (MTProto API) - Optional
# Get these credentials at https://my.telegram.org/apps
# Generate session with: node scripts/generate-telegram-session.js
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION=your_session_string_here

# Authentication (IMPORTANT: Change these in production!)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_min_32_chars
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=1h
BCRYPT_SALT_ROUNDS=10
```

4. **Set up the database**

Run the database migrations in Supabase:
```bash
# Execute the SQL scripts in database/migrations/ in order
# 001_add_authentication.sql - Creates users and authentication tables
```

5. **Build the project**
```bash
npm run build
```

## 🚦 Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

##  API Documentation

Complete interactive API documentation is available via Swagger UI:

**Access:** `http://localhost:3000/api/docs`

The documentation includes:
- All available endpoints with descriptions
- Request/response schemas and examples
- Authentication requirements (future)
- Error responses and status codes
- Interactive testing interface

##  API Endpoints

### 🔐 Authentication
All authentication endpoints are public except `/profile` which requires a Bearer token.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user (owner) | No |
| POST | `/api/auth/login` | Login and get tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/verify` | Verify token validity | No |
| GET | `/api/auth/profile` | Get user profile | Yes |

### 🏪 Stores
Store management endpoints for multi-store owners.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stores/:id` | Get store by ID | No |
| GET | `/api/stores/my-stores` | Get all stores owned by user | Yes (Owner) |
| POST | `/api/stores` | Create a new store | Yes (Owner) |
| PUT | `/api/stores/:id` | Update store information | Yes (Owner) |
| DELETE | `/api/stores/:id` | Delete a store | Yes (Owner) |

### 📦 Products
Product inventory management.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products (paginated) | No |
| GET | `/api/products/:id` | Get product by ID | No |
| GET | `/api/products/search?q=query` | Search products by name | No |
| POST | `/api/products` | Create a new product | Yes (Owner) |
| PUT | `/api/products/:id` | Update product | Yes (Owner) |
| DELETE | `/api/products/:id` | Delete product | Yes (Owner) |

### 🏷️ Categories
Product categorization management.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products/categories` | Get all categories | No |
| GET | `/api/products/categories/:id` | Get category by ID | No |
| GET | `/api/products/categories/store/:storeId` | Get categories by store | Yes (Owner) |
| POST | `/api/products/categories` | Create a new category | Yes (Owner) |
| PUT | `/api/products/categories/:id` | Update category | Yes (Owner) |
| DELETE | `/api/products/categories/:id` | Delete category | Yes (Owner) |
| GET | `/api/products/categories/:id/products` | Get products in category | No |
| POST | `/api/products/categories/:categoryId/products/:productId` | Add product to category | Yes (Owner) |
| DELETE | `/api/products/categories/:categoryId/products/:productId` | Remove product from category | Yes (Owner) |

### 🏷️ Tags
Product tagging management.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products/tags` | Get all tags | No |
| GET | `/api/products/tags/:id` | Get tag by ID | No |
| GET | `/api/products/tags/store/:storeId` | Get tags by store | Yes (Owner) |
| POST | `/api/products/tags` | Create a new tag | Yes (Owner) |
| PUT | `/api/products/tags/:id` | Update tag | Yes (Owner) |
| DELETE | `/api/products/tags/:id` | Delete tag | Yes (Owner) |
| GET | `/api/products/tags/:id/products` | Get products with tag | No |
| POST | `/api/products/tags/:tagId/products/:productId` | Add tag to product | Yes (Owner) |
| DELETE | `/api/products/tags/:tagId/products/:productId` | Remove tag from product | Yes (Owner) |

### 🛒 Orders
Order management and processing.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders (filtered) | Yes |
| GET | `/api/orders/:id` | Get order by ID | Yes |
| GET | `/api/orders/stats` | Get order statistics | Yes (Owner) |
| GET | `/api/orders/store/:storeId` | Get orders by store | Yes (Owner) |
| PATCH | `/api/orders/:id/status` | Update order status | Yes (Owner) |

### 🤖 Bot
Telegram bot webhook and bot creation endpoints.

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| POST | `/api/bot/webhook/:storeId` | Receive Telegram messages | No | 30 req/min |
| POST | `/api/bot/create` | Create Telegram bot automatically | Yes (Owner) | - |

> **Note:** For more information about the automatic bot creation feature, see [Telegram Bot Creation Documentation](./docs/telegram-bot-creation.md)

### ❤️ Health
System health monitoring.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed service checks |

**📚 Complete Documentation:** Visit `/api/docs` for interactive Swagger documentation with request/response examples.

## 🏗️ Architecture

### Project Structure
```
src/
├── config/                      # Centralized configuration
│   ├── env.config.ts           # Environment variables validation
│   ├── swagger.config.ts       # Swagger/OpenAPI configuration
│   └── supabase.ts             # Supabase client
├── middlewares/                # Express middlewares
│   ├── authMiddleware.ts       # JWT authentication & authorization
│   ├── errorHandler.ts         # Global error handling
│   ├── rateLimiter.ts          # Rate limiting
│   ├── requestLogger.ts        # Request logging
│   └── validateRequest.ts      # Zod schema validation
├── modules/                    # Independent modules (Hexagonal Architecture)
│   ├── auth/                   # Authentication module
│   │   ├── application/        # Use cases (AuthService)
│   │   ├── domain/             # Entities, interfaces, validators
│   │   │   ├── errors/         # Custom error classes
│   │   │   ├── services/       # Service interfaces
│   │   │   └── validators/     # Input validators
│   │   └── infrastructure/     # Implementations
│   │       ├── database/       # Supabase repository
│   │       ├── services/       # Bcrypt, JWT services
│   │       └── authController.ts
│   ├── stores/                 # Multi-store management
│   │   ├── application/        # Use cases
│   │   ├── domain/             # Entities and interfaces
│   │   └── infrastructure/     # Repositories and controllers
│   ├── bot/                    # Chatbot module
│   │   ├── application/        # Use cases
│   │   ├── domain/             # Entities and interfaces
│   │   └── infrastructure/     # Telegram, LLM, DB
│   ├── products/               # Products module
│   │   ├── application/        # Use cases (CRUD operations)
│   │   ├── domain/             # Entities and interfaces
│   │   ├── infrastructure/     # Repositories and controllers
│   │   └── schemas/            # Zod validation schemas
│   ├── orders/                 # Orders module
│   │   ├── application/        # Use cases (including notifications)
│   │   ├── domain/             # Entities and interfaces
│   │   ├── infrastructure/     # Repositories and controllers
│   │   └── schemas/            # Zod validation schemas
│   └── health/                 # Health checks
├── utils/                      # Utilities
│   └── logger.ts               # Logging system
└── server.ts                   # Entry point
```

### Applied Principles

#### SOLID Principles
- **Single Responsibility (SRP)**: Each class has one reason to change
  - `AuthService`: Business logic
  - `BcryptPasswordHasher`: Password hashing
  - `JwtTokenService`: Token management
  - `AuthValidator`: Input validation
  
- **Open/Closed (OCP)**: Open for extension, closed for modification
  - Interfaces allow new implementations without changing existing code
  
- **Liskov Substitution (LSP)**: Implementations can replace interfaces
  - `IPasswordHasher` can be Bcrypt, Argon2, or any other implementation
  
- **Interface Segregation (ISP)**: Specific, focused interfaces
  - `IPasswordHasher`, `ITokenService`, `IAuthValidator` are separate
  
- **Dependency Inversion (DIP)**: Depend on abstractions, not concretions
  - Services receive interfaces via dependency injection

#### Architectural Patterns
- **Clean Architecture**: Layer separation (domain, application, infrastructure)
- **Hexagonal Architecture**: Independent modules that communicate through interfaces
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: Loose coupling and testability

##  Automatic Notifications

The system sends automatic Telegram notifications to customers when order status changes:

### Order Status Flow
1. **Pending** ⏳ - Order received, waiting for confirmation
2. **Confirmed** ✅ - Order confirmed and ready
3. **In Transit** 🚚 - Order on its way to customer

Each status change triggers a personalized message to the customer via Telegram, keeping them informed throughout the entire process.

## Security

### Infrastructure Security
- ✅ Validation of all environment variables at startup
- ✅ Helmet for security headers
- ✅ CORS configured
- ✅ Rate limiting per IP
- ✅ Automatic input validation with Zod schemas
- ✅ No exposure of internal errors in production
- ✅ Process error handlers (unhandled rejections, uncaught exceptions)
- ✅ Graceful shutdown on SIGTERM/SIGINT signals

### Bot Security & Privacy
- ✅ **Never requests sensitive information** (credit cards, passwords, IDs)
- ✅ **Maintains customer confidentiality** - No sharing of order details
- ✅ **Minimal data collection** - Only processes necessary purchase information
- ✅ **Secure transactions** - Server-side validation and calculation
- ✅ **Professional communication** - Formal, clear, and trustworthy responses

## 📊 Logging

The logging system has 4 levels:
- **DEBUG**: Detailed information for debugging
- **INFO**: General information
- **WARN**: Warnings
- **ERROR**: Errors

In production, only WARN and ERROR are shown.

## 🧪 Testing

```bash
# Run integration tests
npm test
```

Tests are located in `src/__tests__/integration/` and cover:
- Authentication flows
- Health checks
- Orders CRUD
- Products CRUD
- Stores CRUD

## 🐳 Docker

### Build and run with Docker Compose
```bash
docker-compose up --build
```

### Build image only
```bash
docker build -t orderflow-api .
```

The Docker setup includes:
- Multi-stage build for optimized image size
- Non-root user for security
- Health checks
- Automatic restart policy
- JSON logging with rotation

## 📄 License

ISC

## 👥 Author

OrderFlow Team
