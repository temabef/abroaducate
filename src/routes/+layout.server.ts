import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  let subscription: any = null;

  try {
    if (session?.user?.id && locals.supabase) {
      const { data } = await locals.supabase
        .from('user_subscriptions')
        .select('plan_type, status, admin_override')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .single();
      subscription = data || null;
    }
  } catch {
    subscription = null;
  }

  return {
    session,
    subscription
  }
}