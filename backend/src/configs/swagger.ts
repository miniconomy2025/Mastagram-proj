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
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Google ID token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routers/*.ts',
    './src/controllers/*.ts',
    './src/queries/*.ts',
  ],
};

const swaggerSpecRaw = swaggerJsdoc(options);
const swaggerSpec: any = { ...swaggerSpecRaw };
const raw: any = swaggerSpecRaw;
if (raw && raw.paths && typeof raw.paths === 'object') {
  const newPaths: Record<string, any> = {};
  for (const path in raw.paths) {
    // Add /api prefix to all paths that don't already have it
    if (!path.startsWith('/api/')) {
      newPaths['/api' + path] = raw.paths[path];
    } else {
      newPaths[path] = raw.paths[path];
    }
  }
  swaggerSpec.paths = newPaths;
}

export function setupSwaggerDocs(app: Express) {
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', ensureAuthenticated, (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
