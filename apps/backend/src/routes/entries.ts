import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { entryProcessingQueue } from '../lib/queue.js';

const createEntrySchema = z.object({
  input_type: z.enum(['voice', 'text']),
  raw_text: z.string().min(1).max(5000).optional(),
  audio_url: z.string().url().optional(),
  audio_duration_seconds: z.number().int().positive().optional(),
  image_urls: z.array(z.string().url()).max(5).optional(),
  location: z.string().max(200).optional(),
}).refine(
  (d) => d.input_type === 'text' ? !!d.raw_text : !!d.audio_url,
  { message: 'Text entries require raw_text; voice entries require audio_url' }
);

export async function entriesRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const body = createEntrySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const data = body.data;

    // Free tier: block photo uploads
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (data.image_urls?.length && user?.plan !== 'premium') {
      return reply.status(403).send({ error: 'Photo attachments require a Premium subscription' });
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        input_type: data.input_type,
        raw_text: data.raw_text,
        audio_url: data.audio_url,
        audio_duration_seconds: data.audio_duration_seconds,
        image_urls: data.image_urls ?? [],
        location: data.location,
      })
      .select()
      .single();

    if (error) {
      return reply.status(500).send({ error: 'Failed to create entry' });
    }

    // Queue AI processing
    await entryProcessingQueue.add('process-entry', { entryId: entry.id });

    return reply.status(201).send(entry);
  });

  app.get('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
    const from = (page - 1) * limit;

    const { data: entries, error, count } = await supabase
      .from('entries')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch entries' });
    }

    return reply.send({ entries, total: count, page, limit });
  });

  app.get('/:id', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };

    const { data: entry, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !entry) {
      return reply.status(404).send({ error: 'Entry not found' });
    }

    return reply.send(entry);
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return reply.status(500).send({ error: 'Failed to delete entry' });
    }

    return reply.status(204).send();
  });
}
