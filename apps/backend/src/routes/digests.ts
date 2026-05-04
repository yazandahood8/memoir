import type { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';

export async function digestsRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;

    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .eq('user_id', userId)
      .order('period_end', { ascending: false })
      .limit(20);

    if (error) return reply.status(500).send({ error: 'Failed to fetch digests' });
    return reply.send(data ?? []);
  });

  app.get('/:id', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return reply.status(404).send({ error: 'Digest not found' });
    return reply.send(data);
  });
}
