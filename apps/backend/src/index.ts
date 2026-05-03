import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { supabase } from './lib/supabase.js';
import { entriesRoutes } from './routes/entries.js';
import { collectionsRoutes } from './routes/collections.js';
import { chaptersRoutes } from './routes/chapters.js';
import { searchRoutes } from './routes/search.js';
import { webhooksRoutes } from './routes/webhooks.js';

export async function build(opts: { testing?: boolean } = {}) {
  const app = Fastify({
    logger: opts.testing ? false : { level: 'info' },
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
  });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

  app.addHook('onRequest', async (request, reply) => {
    if (request.routeOptions?.url?.startsWith('/webhooks')) return;
    if (request.routeOptions?.url === '/health') return;
    if (opts.testing && request.routeOptions?.url === '/auth/test-token') return;

    if (opts.testing) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    (request as any).user = { sub: user.id, email: user.email };
  });

  if (opts.testing) {
    app.post('/auth/test-token', async (request, reply) => {
      const { email } = request.body as { email: string };
      const token = app.jwt.sign({ sub: 'test-user-id', email });
      return reply.send({ token });
    });
  }

  await app.register(entriesRoutes, { prefix: '/entries' });
  await app.register(collectionsRoutes, { prefix: '/collections' });
  await app.register(chaptersRoutes, { prefix: '/chapters' });
  await app.register(searchRoutes, { prefix: '/search' });
  await app.register(webhooksRoutes, { prefix: '/webhooks' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = await build();
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
}
