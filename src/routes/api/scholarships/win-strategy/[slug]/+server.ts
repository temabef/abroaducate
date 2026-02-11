import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { getSession, supabaseServiceRole } }) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: 'Unauthorized' }, { status: 401 });

  // Only paid users should read this; enforce by checking subscription (service role)
  const { data: subscription } = await supabaseServiceRole
    .from('user_subscriptions')
    .select('plan_type')
    .eq('user_id', session.user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planType = subscription?.plan_type || 'free';
  const isPaid = planType !== 'free';
  if (!isPaid) return json({ error: 'Upgrade required' }, { status: 403 });

  const scholarshipId = params.slug;
  const { data: row, error } = await supabaseServiceRole
    .from('scholarship_win_strategies')
    .select('strategy, source_hash, updated_at, model, version')
    .eq('scholarship_id', scholarshipId)
    .maybeSingle();

  if (error) {
    return json({ error: 'Failed to load strategy' }, { status: 500 });
  }

  return json({ success: true, strategy: row?.strategy || null, updated_at: row?.updated_at || null });
};

