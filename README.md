# OrderFlow API

REST API built with Node.js, TypeScript, and Clean Architecture to manage orders through an intelligent Telegram chatbot. The system allows users to place product orders through natural conversation, using artificial intelligence (OpenAI) to process requests, search for products, and complete transactions automatically.

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
- **Products Module**: Inventory management and product search
- **Orders Module**: Order creation and management with stock validation
- **Health Module**: API and external services status monitoring

### 🚧 In Development:
- **Authentication Module**: Authentication and authorization system for API security
- **Admin Dashboard**: Administration panel for product and order management

## 🚀 Features

- ✅ **Clean Architecture**: Clear separation between domain, application, and infrastructure
- ✅ **TypeScript**: Strong typing for better security and maintainability
- ✅ **Dependency Injection**: Facilitates testing and implementation changes
- ✅ **Conversational AI**: Natural language processing with OpenAI
- ✅ **Data Validation**: DTOs and robust input validation
- ✅ **Error Handling**: Global middleware with structured logging
- ✅ **Rate Limiting**: Protection against abuse and DDoS attacks
- ✅ **Health Checks**: External services verification (Supabase, OpenAI, Telegram)
- ✅ **Professional Logging**: Log system with levels (debug, info, warn, error)
- ✅ **Security**: Helmet, CORS, environment variables validation
- ✅ **Retry Logic**: Automatic retries on external API calls
- ✅ **Transactions**: Transaction handling with automatic rollback

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Supabase account
- OpenAI API Key
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

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=your-model-ai

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

## 📡 Endpoints

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
    "openai": { "status": "OK" },
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

## 🏗️ Architecture

```
src/
├── config/                 # Centralized configuration
│   ├── env.config.ts      # Environment variables validation
│   └── supabase.ts        # Supabase client
├── middlewares/           # Express middlewares
│   ├── errorHandler.ts    # Global error handling
│   ├── rateLimiter.ts     # Rate limiting
│   └── requestLogger.ts   # Request logging
├── modules/               # Independent modules (Hexagonal Architecture)
│   ├── bot/               # Chatbot module
│   │   ├── application/   # Use cases
│   │   ├── domain/        # Entities and interfaces
│   │   └── infrastructure/# Telegram, OpenAI, DB
│   ├── products/          # Products module
│   │   ├── application/   # Use cases
│   │   ├── domain/        # Entities and interfaces
│   │   └── infrastructure/# Repositories
│   ├── orders/            # Orders module
│   │   ├── application/   # Use cases
│   │   ├── domain/        # Entities and interfaces
│   │   └── infrastructure/# Repositories
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

## 🔒 Security

- ✅ Validation of all environment variables at startup
- ✅ Helmet for security headers
- ✅ CORS configured
- ✅ Rate limiting per IP
- ✅ Input validation with DTOs
- ✅ No exposure of internal errors in production

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
