import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Plan } from '@memoir/shared';

export function useSubscription() {
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlan() {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) { if (!cancelled) setLoading(false); return; }

      const { data: user } = await supabase
        .from('users').select('plan').eq('id', uid).single();

      if (!cancelled) {
        setPlan((user?.plan as Plan) ?? 'free');
        setLoading(false);
      }
    }

    fetchPlan();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchPlan();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { plan, loading, isPremium: plan === 'premium' };
}
