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

### 🚧 In Development:
- **Authentication Module**: Authentication and authorization system for API security
- **Admin Dashboard**: Administration panel for product and order management

## 🚀 Features

- ✅ **Clean Architecture**: Clear separation between domain, application, and infrastructure
- ✅ **TypeScript**: Strong typing for better security and maintainability
- ✅ **Dependency Injection**: Facilitates testing and implementation changes
- ✅ **Conversational AI**: Natural language processing with LLM providers (OpenAI, DeepSeek, Groq, etc.)
- ✅ **Data Validation**: Automatic request validation with Zod schemas
- ✅ **Error Handling**: Global middleware with structured logging and process error handlers
- ✅ **Rate Limiting**: Protection against abuse and DDoS attacks
- ✅ **Health Checks**: External services verification (Supabase, LLM, Telegram)
- ✅ **Professional Logging**: Log system with levels (debug, info, warn, error)
- ✅ **Security**: Helmet, CORS, environment variables validation
- ✅ **Retry Logic**: Automatic retries on external API calls
- ✅ **Transactions**: Transaction handling with automatic rollback
- ✅ **API Documentation**: Professional Swagger/OpenAPI documentation
- ✅ **Privacy & Security**: Bot follows strict data protection principles

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

```

4. **Build the project**
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

##  Endpoints

### Health Checks

#### GET `/health`
Basic health check
```json
{
  "status": "OK",
  "service": "OrderFlow API",
  "timestamp": "2024-12-04T...",
  "environment": "development"
}
```

#### GET `/health/detailed`
Detailed health check with service verification
```json
{
  "status": "OK",
  "service": "OrderFlow API",
  "checks": {
    "api": { "status": "OK" },
    "supabase": { "status": "OK" },
    "llm": { "status": "OK" },
    "telegram": { "status": "OK" }
  }
}
```

### Bot

#### POST `/api/bot/webhook`
Webhook to receive Telegram messages
- Rate limit: 30 requests/minute per IP
- Automatic data validation
- Asynchronous processing
- Ignores Telegram commands (e.g., /start, /help)

### Products

#### GET `/api/products`
Get all products with pagination
- Query params: `limit`, `offset`

#### POST `/api/products`
Create a new product (Admin)
- Body: `name`, `price`, `stock`, `unit`, `category` (optional), `description` (optional)

#### GET `/api/products/search?q=query`
Search products by name

#### GET `/api/products/:id`
Get product details by ID

#### PUT `/api/products/:id`
Update product information (Admin)

#### DELETE `/api/products/:id`
Delete a product (Admin)

### Orders

#### GET `/api/orders`
Get all orders with optional filters
- Query params: `status`, `limit`, `offset`

#### GET `/api/orders/:id`
Get order details by ID

#### PATCH `/api/orders/:id/status`
Update order status (sends automatic notification to customer)
- Body: `status` (pending, confirmed, in_transit)
- Triggers automatic Telegram notification to customer

#### GET `/api/orders/stats`
Get order statistics

**Note:** For complete endpoint documentation with examples, visit `/api/docs`

## Architecture

```
src/
├── config/                 # Centralized configuration
│   ├── env.config.ts      # Environment variables validation
│   ├── swagger.config.ts  # Swagger/OpenAPI configuration
│   └── supabase.ts        # Supabase client
├── middlewares/           # Express middlewares
│   ├── errorHandler.ts    # Global error handling
│   ├── rateLimiter.ts     # Rate limiting
│   ├── requestLogger.ts   # Request logging
│   └── validateRequest.ts # Zod schema validation
├── modules/               # Independent modules (Hexagonal Architecture)
│   ├── bot/               # Chatbot module
│   │   ├── application/   # Use cases
│   │   ├── domain/        # Entities and interfaces
│   │   └── infrastructure/# Telegram, LLM, DB
│   ├── products/          # Products module
│   │   ├── application/   # Use cases (CRUD operations)
│   │   ├── domain/        # Entities and interfaces
│   │   ├── infrastructure/# Repositories and controllers
│   │   └── schemas/       # Zod validation schemas
│   ├── orders/            # Orders module
│   │   ├── application/   # Use cases (including notifications)
│   │   ├── domain/        # Entities and interfaces
│   │   ├── infrastructure/# Repositories and controllers
│   │   └── schemas/       # Zod validation schemas
│   └── health/            # Health checks
├── utils/                 # Utilities
│   └── logger.ts          # Logging system
└── server.ts              # Entry point
```

### Applied Principles

- **Clean Architecture**: Layer separation (domain, application, infrastructure)
- **Hexagonal Architecture**: Independent modules that communicate through interfaces
- **Dependency Inversion**: Dependencies point towards abstractions
- **Single Responsibility**: Each module has a single responsibility

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
# Run tests (when implemented)
npm test
```

## 📄 License

ISC

## 👥 Author

OrderFlow Team
