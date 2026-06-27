import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi';

export function mountSwaggerDocs(app: Express): void {
  const document = buildOpenApiDocument();

  app.get('/api/docs.json', (_req, res) => res.json(document));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document, { customSiteTitle: 'Medicare Medical Store API Docs' }));
}
