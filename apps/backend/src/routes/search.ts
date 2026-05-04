import type { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';
import OpenAI from 'openai';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { query } = request.body as { query?: string };

    if (!query?.trim()) {
      return reply.status(400).send({ error: 'query is required' });
    }

    const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single();
    if (user?.plan !== 'premium') {
      return reply.status(403).send({ error: 'Semantic search requires Premium' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return reply.send({ results: [], stub: true });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { data: embedding } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const vector = embedding[0].embedding;

    const { data: results, error } = await supabase.rpc('search_entries', {
      query_vector: vector,
      user_id: userId,
      match_count: 10,
    });

    if (error) return reply.status(500).send({ error: 'Search failed' });
    return reply.send({ results });
  });
}
