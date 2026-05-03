import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { entryProcessingQueue } from '../lib/queue.js';

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function collectionsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const body = createCollectionSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    // Free tier: max 1 active collection
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (user?.plan !== 'premium') {
      const { count } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      if ((count ?? 0) >= 1) {
        return reply.status(403).send({ error: 'Free plan allows 1 active collection. Upgrade to Premium for unlimited.' });
      }
    }

    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, name: body.data.name, description: body.data.description })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: 'Failed to create collection' });
    return reply.status(201).send(data);
  });

  app.get('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;

    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_entries(count)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) return reply.status(500).send({ error: 'Failed to fetch collections' });
    return reply.send(data);
  });

  app.get('/:id', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('collections')
      .select(`*, collection_entries(entry_id, entries(*))`)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return reply.status(404).send({ error: 'Collection not found' });
    return reply.send(data);
  });

  app.patch('/:id', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };
    const body = createCollectionSchema.partial().safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { data, error } = await supabase
      .from('collections')
      .update(body.data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: 'Collection not found' });
    return reply.send(data);
  });

  app.post('/:id/close', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };

    const { data: col } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!col) return reply.status(404).send({ error: 'Collection not found' });
    if (col.status !== 'active') return reply.status(400).send({ error: 'Collection is already closed' });

    const { data, error } = await supabase
      .from('collections')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: 'Failed to close collection' });

    // Check premium for chapter generation
    const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single();
    let chapterQueued = false;
    if (user?.plan === 'premium') {
      await entryProcessingQueue.add('generate-chapter', { collectionId: id });
      chapterQueued = true;
    }

    return reply.send({ ...data, chapter_queued: chapterQueued });
  });

  app.post('/:id/entries', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };
    const { entry_ids } = request.body as { entry_ids: string[] };

    if (!Array.isArray(entry_ids) || entry_ids.length === 0) {
      return reply.status(400).send({ error: 'entry_ids array required' });
    }

    const rows = entry_ids.map((eid) => ({ collection_id: id, entry_id: eid }));
    const { error } = await supabase.from('collection_entries').upsert(rows, { ignoreDuplicates: true });
    if (error) return reply.status(500).send({ error: 'Failed to add entries' });

    return reply.send({ added: entry_ids.length });
  });

  app.delete('/:id/entries/:entryId', async (request, reply) => {
    const { id, entryId } = request.params as { id: string; entryId: string };

    const { error } = await supabase
      .from('collection_entries')
      .delete()
      .eq('collection_id', id)
      .eq('entry_id', entryId);

    if (error) return reply.status(500).send({ error: 'Failed to remove entry' });
    return reply.status(204).send();
  });
}
