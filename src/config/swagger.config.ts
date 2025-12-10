import swaggerJsdoc from 'swagger-jsdoc';
import { envConfig } from './env.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OrderFlow API',
      version: '1.0.0',
      description: `
# OrderFlow API Documentation

Professional REST API for conversational commerce through Telegram bot with AI-powered order processing.

## Features
- 🤖 **AI-Powered Bot**: Intelligent chatbot using LLM providers (OpenAI, DeepSeek, Groq)
- 📦 **Product Management**: Real-time inventory and product search
- 🛒 **Order Processing**: Automated order creation with stock validation
- 🔒 **Security**: Rate limiting, input validation, and secure transactions
- 📊 **Health Monitoring**: Comprehensive health checks for all services

## Architecture
Built with Clean Architecture and Hexagonal Architecture principles for maintainability and scalability.

## Authentication
Currently, the bot webhook is public. Future versions will include JWT authentication for admin endpoints.
      `.trim(),
      contact: {
        name: 'OrderFlow Team',
        email: 'support@orderflow.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${envConfig.PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://api.orderflow.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'API health check and service monitoring endpoints'
      },
      {
        name: 'Bot',
        description: 'Telegram bot webhook for receiving and processing messages'
      },
      {
        name: 'Products',
        description: 'Product inventory management and search operations'
      },
      {
        name: 'Orders',
        description: 'Order creation, retrieval, and management operations'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated requests (future implementation)'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message describing what went wrong',
              example: 'Invalid request data'
            },
            details: {
              type: 'object',
              description: 'Additional error details for debugging',
              additionalProperties: true
            }
          },
          required: ['error']
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['OK', 'DEGRADED', 'ERROR'],
              description: 'Overall system health status',
              example: 'OK'
            },
            service: {
              type: 'string',
              description: 'Service name',
              example: 'OrderFlow API'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp of the health check',
              example: '2024-12-10T22:00:00.000Z'
            },
            environment: {
              type: 'string',
              enum: ['development', 'production'],
              description: 'Current environment',
              example: 'development'
            }
          },
          required: ['status', 'service', 'timestamp', 'environment']
        },
        DetailedHealthCheck: {
          allOf: [
            { $ref: '#/components/schemas/HealthCheck' },
            {
              type: 'object',
              properties: {
                checks: {
                  type: 'object',
                  description: 'Health status of individual services',
                  properties: {
                    api: {
                      $ref: '#/components/schemas/ServiceCheck'
                    },
                    supabase: {
                      $ref: '#/components/schemas/ServiceCheck'
                    },
                    llm: {
                      $ref: '#/components/schemas/ServiceCheck'
                    },
                    telegram: {
                      $ref: '#/components/schemas/ServiceCheck'
                    }
                  },
                  required: ['api', 'supabase', 'llm', 'telegram']
                }
              },
              required: ['checks']
            }
          ]
        },
        ServiceCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['OK', 'ERROR'],
              description: 'Service health status',
              example: 'OK'
            },
            message: {
              type: 'string',
              description: 'Detailed status message',
              example: 'Service is operational'
            }
          },
          required: ['status', 'message']
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique product identifier',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Premium Coffee Beans'
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'High-quality arabica coffee beans'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price in USD',
              example: 15.99
            },
            stock: {
              type: 'integer',
              description: 'Available stock quantity',
              example: 100
            },
            category: {
              type: 'string',
              description: 'Product category',
              example: 'Beverages'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Product creation timestamp'
            }
          },
          required: ['id', 'name', 'price', 'stock']
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique order identifier',
              example: '123e4567-e89b-12d3-a456-426614174001'
            },
            user_id: {
              type: 'string',
              description: 'Telegram chat ID of the customer',
              example: '123456789'
            },
            items: {
              type: 'array',
              description: 'List of ordered items',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total order amount in USD',
              example: 47.97
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status',
              example: 'confirmed'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            }
          },
          required: ['id', 'user_id', 'items', 'total', 'status']
        },
        OrderItem: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              format: 'uuid',
              description: 'Product identifier'
            },
            product_name: {
              type: 'string',
              description: 'Product name'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity ordered'
            },
            unit_price: {
              type: 'number',
              format: 'float',
              description: 'Price per unit'
            }
          },
          required: ['product_id', 'product_name', 'quantity', 'unit_price']
        },
        TelegramWebhook: {
          type: 'object',
          description: 'Telegram webhook update object',
          properties: {
            update_id: {
              type: 'integer',
              description: 'Unique update identifier',
              example: 123456789
            },
            message: {
              type: 'object',
              description: 'Message object',
              properties: {
                message_id: {
                  type: 'integer'
                },
                from: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer'
                    },
                    first_name: {
                      type: 'string'
                    }
                  }
                },
                chat: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer'
                    },
                    type: {
                      type: 'string'
                    }
                  }
                },
                text: {
                  type: 'string',
                  description: 'Message text',
                  example: 'I want to buy coffee'
                }
              }
            }
          },
          required: ['update_id']
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Invalid request data',
                details: {
                  field: 'email',
                  message: 'Invalid email format'
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Authentication required'
              }
            }
          }
        },
        NotFound: {
          description: 'Not found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Too many requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Rate limit exceeded. Please try again later.'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'An unexpected error occurred'
              }
            }
          }
        },
        ServiceUnavailable: {
          description: 'Service unavailable - One or more services are down',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DetailedHealthCheck'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/modules/**/*.ts', './src/server.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
