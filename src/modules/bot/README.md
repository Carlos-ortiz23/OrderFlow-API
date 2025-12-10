# Bot Module - OrderFlow API

## 📋 Description

Intelligent chatbot module that manages communication with Telegram and processes messages using AI (LLM providers). This module focuses solely on conversational interaction and delegates product and order logic to their respective modules.

## 🏗️ Architecture

The module follows **Clean Architecture** and **Hexagonal Architecture**:

```
bot/
├── domain/              # Bot entities and interfaces
│   ├── chatHistoryRepositoryInterface.ts
│   └── messagingProviderInterface.ts
├── application/         # Use cases
│   └── processMessageUseCase.ts
└── infrastructure/      # Concrete implementations
    ├── database/        # Chat history repository
    │   └── supabaseChatHistoryRepository.ts
    ├── telegram/        # Telegram provider
    │   └── telegramProvider.ts
    ├── llm/             # AI Agent
    │   └── llmProvider.ts
    └── dtos/           # Data validators
        └── telegramWebhookDto.ts
```

## 🔗 Dependencies with Other Modules

This module does **NOT** contain product or order logic. Instead, it consumes:

- **ProductModule**: For product search
- **OrderModule**: For order creation

This ensures **separation of concerns** and facilitates maintenance.

## ✨ Implemented Improvements

### 1. **Dependency Inversion**
- ✅ `LLMProvider` now depends on interfaces (`ProductRepository`, `OrderRepository`) instead of concrete implementations
- ✅ Facilitates testing and allows changing implementations without modifying code

### 2. **Robust Error Handling**
- ✅ `TelegramProvider` with retry logic (3 attempts with exponential backoff)
- ✅ Input validation in all public methods
- ✅ Improved rollback in transactions with error handling

### 3. **Clean Code**
- ✅ Removed duplicate code (`reduceStock` in ProductRepository)
- ✅ Removed unused methods (`getOrderById`, `getOrdersByUserId`, `clearHistory`)
- ✅ Removed unnecessary fields in DTOs (`entities`)
- ✅ Removed redundant validation in controller

### 4. **Type Safety**
- ✅ History correctly typed as `ChatMessage[]` instead of `any[]`
- ✅ Correct use of LLM SDK types for messages
- ✅ History limit validation (1-50 messages)

### 5. **Structured Logging**
- ✅ Replaced `console.log`/`console.error` with `logger` in all files
- ✅ Logging with context (userId, chatId, etc.)
- ✅ Appropriate levels: `debug`, `info`, `warn`, `error`

### 6. **Improved Configuration**
- ✅ `LLM_MODEL` and `LLM_URL` variables added to configuration
- ✅ Supports multiple providers (OpenAI, DeepSeek, Groq, etc.)
- ✅ Configurable via environment variables

### 7. **Documentation**
- ✅ Detailed comments about transactions and RPC
- ✅ Documentation of required SQL function
- ✅ JSDoc on interfaces and public methods

## 🔧 Required Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# LLM Configuration
LLM_API_KEY=your-api-key
LLM_MODEL=deepseek-chat
LLM_URL=https://api.deepseek.com

# Examples for different providers:
# OpenAI: LLM_URL=https://api.openai.com/v1
# DeepSeek: LLM_URL=https://api.deepseek.com
# Groq: LLM_URL=https://api.groq.com/openai/v1

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

## 🚀 Usage

### Telegram Webhook

The bot receives messages through the endpoint:

```
POST /api/bot/webhook
```

### Conversation Flow

1. User sends message to Telegram
2. Telegram sends webhook to the API
3. `BotController` validates and processes the webhook
4. `ProcessMessageUseCase` coordinates the logic:
   - Loads conversation history
   - Executes the AI agent
   - Sends response through Telegram
   - Saves the interaction in history
5. `LLMProvider` (Agent):
   - Searches for products if necessary
   - Finalizes order when user confirms
   - Maintains conversation context

## 🧪 Testing

To test the bot:

1. Configure a bot on Telegram with [@BotFather](https://t.me/botfather)
2. Configure the webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/bot/webhook"
   ```
3. Send messages to the bot

### Conversation Examples

```
User: Hello, I want to buy rice
Bot: Hello! Sure, let me search for rice in our inventory...
     We have: Diana Rice 1kg - $3.50 (Stock: 100)
     How many do you want?

User: 2 units
Bot: Perfect, 2 units of Diana Rice. Total: $7.00
     Do you want anything else?

User: No, that's all
Bot: Order confirmed! 
     ID: abc-123
     Total: $7.00
     Thank you for your purchase!
```

## 📊 Metrics and Monitoring

The module uses structured logging with the following levels:

- **debug**: Product searches, technical details
- **info**: Processed messages, created orders
- **warn**: Invalid webhooks, retries
- **error**: Critical errors, transaction failures

## 🔒 Security

- ✅ Telegram webhook validation
- ✅ Rate limiting on webhook endpoint
- ✅ Stock validation before creating orders
- ✅ Total calculation on server (doesn't trust client)
- ✅ Automatic rollback in case of errors


### Bot doesn't respond
- Verify that the webhook is configured correctly
- Check logs for errors
- Verify environment variables


## 📝 Technical Notes

### History Limits

History is limited to 50 messages maximum to:
- Avoid consuming too many LLM tokens
- Maintain fast responses
- Reduce costs

## 🤝 Contributing

When modifying this module:
1. Maintain clean architecture
2. Use interfaces for dependencies
3. Add structured logging
4. Document important changes
5. Update this README
