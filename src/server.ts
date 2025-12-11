import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";
import { BotModule } from "./modules/bot/botModule";
import { ProductModule } from "./modules/products/productModule";
import { OrderModule } from "./modules/orders/orderModule";
import { HealthController } from "./modules/health/healthController";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { envConfig } from "./config/env.config";
import { logger } from "./utils/logger";

class Server {
  private app: Application;
  private port: string;
  private nodeEnv: string

  constructor() {
    this.app = express();
    this.port = envConfig.PORT;
    this.nodeEnv = envConfig.NODE_ENV;

    this.middlewares();
    this.routes();
    this.errorHandlers(); // Add error middlewares at the end
  }

  private middlewares() {
    // Request logger (must go first to capture all requests)
    this.app.use(requestLogger);
    
    // Helmet for basic header security
    this.app.use(helmet());
    
    // CORS to allow requests from frontend/dashboard
    this.app.use(cors());
    
    // JSON parsing (useful for webhooks)
    this.app.use(express.json());
  }

  private routes() {
    // Favicon handler (to avoid 404 logs) response with code 204 (no content).
    this.app.get("/favicon.ico", (req, res) => res.status(204).end());

    // API Documentation (Swagger)
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'OrderFlow API Documentation',
      customfavIcon: '/favicon.ico'
    }));

    // Health Checks
    this.app.get("/health", HealthController.basic);
    this.app.get("/health/detailed", HealthController.detailed);

    // Modules (Hexagonal architecture - each module is independent)
    this.app.use("/api/bot", BotModule.routes);
    this.app.use("/api/products", ProductModule.routes);
    this.app.use("/api/orders", OrderModule.routes);
  }

  private errorHandlers() {
    // Middleware for not found routes (must go before errorHandler)
    this.app.use(notFoundHandler);

    // Global error handling middleware (must go at the end)
    this.app.use(errorHandler);
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(` Server running on port ${this.port}`);
      logger.info(` Environment: ${this.nodeEnv}`);
      logger.info(` Health check: http://localhost:${this.port}/health`);
      logger.info(` API Documentation: http://localhost:${this.port}/api/docs`);
    });
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Exit gracefully
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error });
  // Exit gracefully
  process.exit(1);
});

// Handle SIGTERM signal (graceful shutdown)
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

const server = new Server();
server.listen();
