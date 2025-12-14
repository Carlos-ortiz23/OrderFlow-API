import swaggerJsdoc from 'swagger-jsdoc';
import { envConfig } from './env.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OrderFlow API Documentation',
      version: '1.0.0',
      description: `
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
      },
      {
        name: 'Stores',
        description: 'Store management and retrieval operations'
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
            success: {
              type: 'boolean',
              example: false,
              description: 'Always false for errors'
            },
            error: {
              type: 'string',
              description: 'Error message describing what went wrong',
              example: 'Invalid request data'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 400
            },
            details: {
              type: 'array',
              description: 'Validation error details (for Zod validation errors)',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'body.price'
                  },
                  message: {
                    type: 'string',
                    example: 'Price must be a positive number'
                  }
                }
              }
            }
          },
          required: ['success', 'error']
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
        Store: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique store identifier',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Store name',
              example: 'My Coffee Shop'
            },
            slug: {
              type: 'string',
              description: 'URL friendly slug',
              example: 'my-coffee-shop'
            },
            address: {
              type: 'string',
              description: 'Physical address',
              example: '123 Main St, City'
            },
            phone: {
              type: 'string',
              description: 'Contact phone number',
              example: '+1234567890'
            },
            is_active: {
              type: 'boolean',
              description: 'Store active status',
              example: true
            }
          },
          required: ['id', 'name', 'slug']
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            full_name: {
              type: 'string',
              description: 'Full name of the user'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'viewer'],
              description: 'User role'
            },
            store_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated store ID'
            }
          },
          required: ['id', 'email', 'role']
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
            unit: {
              type: 'string',
              description: 'Unit of measurement',
              example: 'kg'
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
          required: ['id', 'name', 'price', 'stock', 'unit']
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
            userId: {
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
              enum: ['pending', 'confirmed', 'in_transit'],
              description: 'Order status',
              example: 'confirmed'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            }
          },
          required: ['id', 'userId', 'items', 'total', 'status']
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
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        Created: {
          description: 'Resource created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - Invalid input data or validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              examples: {
                validationError: {
                  summary: 'Validation Error',
                  value: {
                    success: false,
                    error: 'Validation failed',
                    details: [
                      {
                        field: 'body.price',
                        message: 'Price must be a positive number'
                      },
                      {
                        field: 'body.stock',
                        message: 'Stock must be an integer'
                      }
                    ]
                  }
                },
                missingFields: {
                  summary: 'Missing Required Fields',
                  value: {
                    success: false,
                    error: 'Name, price, and stock are required fields'
                  }
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
              examples: {
                productNotFound: {
                  summary: 'Product Not Found',
                  value: {
                    success: false,
                    error: 'Product not found'
                  }
                },
                orderNotFound: {
                  summary: 'Order Not Found',
                  value: {
                    success: false,
                    error: 'Order not found'
                  }
                }
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
              examples: {
                generic: {
                  summary: 'Generic Server Error',
                  value: {
                    success: false,
                    error: 'Internal server error',
                    statusCode: 500
                  }
                },
                specific: {
                  summary: 'Specific Error (Development)',
                  value: {
                    success: false,
                    error: 'Error creating product',
                    statusCode: 500,
                    stack: '...',
                    details: {
                      path: '/api/products',
                      method: 'POST',
                      timestamp: '2024-12-11T00:00:00.000Z'
                    }
                  }
                }
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
