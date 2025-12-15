import swaggerJsdoc from 'swagger-jsdoc';
import { envConfig } from './env.config';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load the swagger.yaml file
const swaggerYamlPath = (() => {
  const cwdPath = path.resolve(process.cwd(), 'swagger.yaml');
  if (fs.existsSync(cwdPath)) return cwdPath;

  return path.resolve(__dirname, '..', '..', 'swagger.yaml');
})();
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
  apis: (() => {
    const distModulesGlob = './dist/modules/**/*.js';
    const distServer = './dist/server.js';
    const distServerAbs = path.resolve(process.cwd(), distServer);

    // If we are running a compiled build (e.g., in Docker/Cloud Run), prefer dist.
    // This avoids missing docs when NODE_ENV is set to "development" in production.
    if (fs.existsSync(distServerAbs)) {
      return [distModulesGlob, distServer];
    }

    return ['./src/modules/**/*.ts', './src/server.ts'];
  })()
};

export const swaggerSpec = swaggerJsdoc(options);
