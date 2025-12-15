import swaggerJsdoc from 'swagger-jsdoc';
import { envConfig } from './env.config';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load the swagger.yaml file
const swaggerYamlPath = path.join(__dirname, '..', '..', 'swagger.yaml');
let swaggerDocument: any;

try {
  const fileContents = fs.readFileSync(swaggerYamlPath, 'utf8');
  swaggerDocument = yaml.load(fileContents);
  
  // Update server URLs dynamically
  swaggerDocument.servers = [
    {
      url: `http://localhost:${envConfig.PORT}`,
      description: 'Development server'
    },
    {
      url: 'https://orderflow-api-831973953542.northamerica-south1.run.app',
      description: 'Production server'
    }
  ];
} catch (error) {
  console.error('Error loading swagger.yaml:', error);
  // Fallback to basic configuration
  swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'OrderFlow API',
      version: '1.0.0',
      description: 'Professional REST API for conversational commerce through Telegram bot with AI-powered order processing.'
    },
    servers: [
      {
        url: `http://localhost:${envConfig.PORT}`,
        description: 'Development server'
      }
    ]
  };
}

const options: swaggerJsdoc.Options = {
  definition: swaggerDocument,
  apis: envConfig.NODE_ENV === 'production'
    ? ['./dist/modules/**/*.js', './dist/server.js']
    : ['./src/modules/**/*.ts', './src/server.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
