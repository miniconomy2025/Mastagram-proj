import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { ensureAuthenticated } from './passport.config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mastagram API',
      version: '1.0.0',
      description: 'API documentation for Mastagram backend',
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Google ID token',
        },
      },
    },
  },
  apis: [
    './src/routers/*.ts',
    './src/controllers/*.ts',
    './src/queries/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwaggerDocs(app: Express) {
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', ensureAuthenticated, (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
