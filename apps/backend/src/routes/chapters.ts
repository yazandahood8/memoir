import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { entryProcessingQueue } from '../lib/queue.js';

const regenerateSchema = z.object({
  style: z.enum(['warm', 'formal', 'narrative']),
});

export async function chaptersRoutes(app: FastifyInstance) {
  app.get('/:collectionId', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { collectionId } = request.params as { collectionId: string };

    const { data: col } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (!col) return reply.status(404).send({ error: 'Collection not found' });

    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('collection_id', collectionId)
      .single();

    if (error || !data) return reply.status(404).send({ error: 'Chapter not yet generated' });
    return reply.send(data);
  });

  app.post('/:id/regenerate', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };
    const body = regenerateSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single();
    if (user?.plan !== 'premium') {
      return reply.status(403).send({ error: 'Chapter regeneration requires Premium' });
    }

    const { data: chapter } = await supabase
      .from('chapters')
      .select('collection_id')
      .eq('id', id)
      .single();

    if (!chapter) return reply.status(404).send({ error: 'Chapter not found' });

    await entryProcessingQueue.add('generate-chapter', {
      collectionId: chapter.collection_id,
      style: body.data.style,
    });

    return reply.send({ queued: true });
  });
}
