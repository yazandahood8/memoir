import type { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';

export async function webhooksRoutes(app: FastifyInstance) {
  app.post('/revenuecat', async (request, reply) => {
    const event = request.body as {
      event: { type: string; app_user_id: string };
    };

    const { type, app_user_id } = event.event;

    const planMap: Record<string, string> = {
      INITIAL_PURCHASE: 'premium',
      RENEWAL: 'premium',
      UNCANCELLATION: 'premium',
      CANCELLATION: 'free',
      EXPIRATION: 'free',
      REFUND: 'free',
    };

    const newPlan = planMap[type];
    if (!newPlan) return reply.send({ received: true });

    await supabase
      .from('users')
      .update({ plan: newPlan })
      .eq('revenuecat_id', app_user_id);

    return reply.send({ received: true });
  });
}
