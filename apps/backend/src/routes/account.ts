import type { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';

export async function accountRoutes(app: FastifyInstance) {
  // GET /account/profile — user plan, email, stats
  app.get('/profile', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;

    const { data: user } = await supabase
      .from('users').select('id, email, plan, created_at').eq('id', userId).single();

    if (!user) return reply.status(404).send({ error: 'User not found' });

    const [{ count: entryCount }, { count: collectionCount }] = await Promise.all([
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    return reply.send({
      ...user,
      stats: { entries: entryCount ?? 0, collections: collectionCount ?? 0 },
    });
  });

  // POST /account/export — export all user data as JSON
  app.post('/export', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;

    const [
      { data: entries },
      { data: collections },
      { data: chapters },
      { data: digests },
    ] = await Promise.all([
      supabase.from('entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('collections').select('*').eq('user_id', userId),
      supabase.from('chapters').select('content, style, generated_at, word_count, collection_id'),
      supabase.from('digests').select('type, content, period_start, period_end').eq('user_id', userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      entries: entries ?? [],
      collections: collections ?? [],
      chapters: chapters ?? [],
      digests: digests ?? [],
    };

    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename="memoir-export.json"')
      .send(exportData);
  });

  // DELETE /account — soft-delete the account
  app.delete('/', async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;

    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return reply.status(500).send({ error: 'Failed to delete account' });

    await supabase.auth.admin.deleteUser(userId);
    return reply.status(204).send();
  });
}
