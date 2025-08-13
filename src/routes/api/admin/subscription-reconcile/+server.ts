import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRIPE_SECRET_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Simple auth gate (same pattern as cron): Authorization: Bearer <CRON_SECRET>
    const auth = request.headers.get('authorization') || request.headers.get('x-authorization');
    if (!auth || auth !== `Bearer ${CRON_SECRET}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1) Load Stripe subscriptions (all, but we care about active/trialing)
    const stripeSubs: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({ limit: 100 });
    const more: Stripe.Subscription[] = [];
    let startingAfter: string | undefined = stripeSubs.data.length ? stripeSubs.data[stripeSubs.data.length - 1].id : undefined;
    let hasMore = stripeSubs.has_more;
    while (hasMore && startingAfter) {
      const next = await stripe.subscriptions.list({ limit: 100, starting_after: startingAfter });
      more.push(...next.data);
      hasMore = next.has_more;
      startingAfter = next.data.length ? next.data[next.data.length - 1].id : undefined;
    }
    const allStripeSubs = [...stripeSubs.data, ...more];

    const stripeBySubId = new Map<string, Stripe.Subscription>();
    const stripeByUser = new Map<string, Stripe.Subscription[]>();
    for (const s of allStripeSubs) {
      stripeBySubId.set(s.id, s);
      const userId = (s.metadata?.user_id as string) || '';
      if (userId) {
        const arr = stripeByUser.get(userId) || [];
        arr.push(s);
        stripeByUser.set(userId, arr);
      }
    }

    // 2) Load DB subscriptions
    const { data: dbSubs, error: dbErr } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, plan_type, status, stripe_subscription_id, updated_at, admin_override');
    if (dbErr) throw dbErr;

    // Helpers
    const isActiveLike = (status?: string | null) => status === 'active' || status === 'trialing';

    // 3) Compute discrepancies
    const stripeActiveNotInDB: any[] = [];
    const dbActiveNotInStripe: any[] = [];

    // a) Stripe active/trialing but DB not reflecting
    for (const s of allStripeSubs) {
      const sActive = isActiveLike(s.status);
      const userId = (s.metadata?.user_id as string) || null;
      if (!userId) continue; // skip subs without mapped user
      if (sActive) {
        const match = dbSubs?.find(
          (d) => d.user_id === userId && d.stripe_subscription_id === s.id && isActiveLike(d.status)
        );
        if (!match) {
          stripeActiveNotInDB.push({
            user_id: userId,
            stripe_subscription_id: s.id,
            stripe_status: s.status,
            db_status: null,
          });
        }
      }
    }

    // b) DB active/trialing but Stripe not reflecting
    for (const d of dbSubs || []) {
      if (isActiveLike(d.status)) {
        // Ignore protected accounts explicitly marked by admin_override
        if ((d as any).admin_override === true) {
          continue;
        }
        const s = d.stripe_subscription_id ? stripeBySubId.get(d.stripe_subscription_id) : undefined;
        const sActive = s ? isActiveLike(s.status) : false;
        if (!sActive) {
          dbActiveNotInStripe.push({
            user_id: d.user_id,
            stripe_subscription_id: d.stripe_subscription_id,
            db_status: d.status,
            stripe_status: s?.status || 'missing',
          });
        }
      }
    }

    return json({
      summary: {
        stripe_total: allStripeSubs.length,
        db_total: (dbSubs || []).length,
        stripe_active_not_in_db: stripeActiveNotInDB.length,
        db_active_not_in_stripe: dbActiveNotInStripe.length,
      },
      stripe_active_not_in_db: stripeActiveNotInDB,
      db_active_not_in_stripe: dbActiveNotInStripe,
    });
  } catch (err: any) {
    return json({ error: err?.message || 'Failed to reconcile' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const auth = request.headers.get('authorization') || request.headers.get('x-authorization');
    if (!auth || auth !== `Bearer ${CRON_SECRET}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string | undefined;
    if (action === 'downgrade_orphaned') {
      // Downgrade DB rows that are marked active/trialing but have no Stripe subscription id and no admin override
      const { data: rows, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id, status, admin_override, stripe_subscription_id, plan_type')
        .is('stripe_subscription_id', null)
        .in('status', ['active', 'trialing'])
        .eq('admin_override', false);
      if (error) throw error;
      let updated = 0;
      const touched: any[] = [];
      for (const r of rows || []) {
        const { error: upErr } = await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'free', updated_at: new Date().toISOString() })
          .eq('user_id', r.user_id);
        if (!upErr) {
          updated += 1;
          touched.push({ user_id: r.user_id, from: r.status, to: 'free' });
        }
      }
      return json({ success: true, updated, touched });
    }

    if (action !== 'fix_from_stripe') {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Load Stripe active/trialing subs
    const stripeSubs: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({ limit: 100 });
    const more: Stripe.Subscription[] = [];
    let startingAfter: string | undefined = stripeSubs.data.length ? stripeSubs.data[stripeSubs.data.length - 1].id : undefined;
    let hasMore = stripeSubs.has_more;
    while (hasMore && startingAfter) {
      const next = await stripe.subscriptions.list({ limit: 100, starting_after: startingAfter });
      more.push(...next.data);
      hasMore = next.has_more;
      startingAfter = next.data.length ? next.data[next.data.length - 1].id : undefined;
    }
    const allStripeSubs = [...stripeSubs.data, ...more].filter((s) => s.status === 'active' || s.status === 'trialing');

    const { data: dbSubs } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, plan_type, status, stripe_subscription_id, admin_override')
      .in('status', ['active', 'trialing']);

    const dbByStripeId = new Map<string, any>();
    for (const d of dbSubs || []) {
      if (d.stripe_subscription_id) dbByStripeId.set(d.stripe_subscription_id, d);
    }

    let fixed = 0;
    const touched: Array<{ user_id: string; stripe_subscription_id: string; status: string; plan_type: string }> = [];

    for (const s of allStripeSubs) {
      const userId = (s.metadata?.user_id as string) || '';
      if (!userId) continue;
      const planType = (s.metadata?.plan_type as string) || 'professional';

      const existing = dbByStripeId.get(s.id);
      const status = s.status === 'trialing' ? 'trialing' : 'active';
      const updateData: any = {
        user_id: userId,
        stripe_subscription_id: s.id,
        stripe_customer_id: String(s.customer || ''),
        status,
        current_period_start: new Date((s as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((s as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      // Respect admin_override: don't overwrite plan if override present
      if (!existing?.admin_override) {
        updateData.plan_type = planType;
      }

      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(updateData, { onConflict: 'user_id', ignoreDuplicates: false });
      if (!error) {
        fixed += 1;
        touched.push({ user_id: userId, stripe_subscription_id: s.id, status, plan_type: updateData.plan_type || existing?.plan_type || 'free' });
      }
    }

    return json({ success: true, fixed, touched });
  } catch (err: any) {
    return json({ error: err?.message || 'Failed to fix' }, { status: 500 });
  }
};


