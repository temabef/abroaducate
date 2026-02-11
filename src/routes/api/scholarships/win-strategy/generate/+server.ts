import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getAIModelForUser } from '$lib/ai-models';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits.server';
import { computeScholarshipSourceHash, generateScholarshipWinStrategy } from '$lib/server/scholarshipWinStrategy.server';

const bodySchema = z.object({
  scholarship_id: z.string().min(1),
  force: z.boolean().optional().default(false)
});

export const POST: RequestHandler = async ({ request, locals: { getSession, supabaseServiceRole } }) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { scholarship_id, force } = parsed.data;

  // Paid gating via limits table: free = 0
  const usage = await checkComprehensiveUsageLimit(session.user.id, 'scholarship_win_strategy');
  if (!usage.allowed) {
    return json(
      {
        error: 'Upgrade required',
        message: usage.message || 'This feature requires a paid plan.',
        planType: usage.planType,
        upgradeRequired: true
      },
      { status: 403 }
    );
  }

  // Fetch scholarship from public decoded view
  const { data: scholarship, error: sErr } = await supabaseServiceRole
    .from('public_scholarships_decoded')
    .select('*')
    .eq('id', scholarship_id)
    .single();

  if (sErr || !scholarship) {
    return json({ error: 'Scholarship not found' }, { status: 404 });
  }

  const sourceHash = computeScholarshipSourceHash(scholarship);

  // If exists and unchanged, return existing unless forced
  if (!force) {
    const { data: existing } = await supabaseServiceRole
      .from('scholarship_win_strategies')
      .select('id, scholarship_id, version, model, strategy, source_hash, created_at, updated_at')
      .eq('scholarship_id', scholarship_id)
      .maybeSingle();

    if (existing?.strategy && existing.source_hash === sourceHash) {
      return json({ success: true, strategy: existing.strategy, cached: true });
    }
  }

  // Pick model based on subscription
  const model = await getAIModelForUser(supabaseServiceRole as any, session.user.id);

  const strategy = await generateScholarshipWinStrategy({ scholarship, model });

  const { error: upsertErr } = await supabaseServiceRole
    .from('scholarship_win_strategies')
    .upsert(
      {
        scholarship_id,
        version: 1,
        model,
        strategy,
        source_hash: sourceHash,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'scholarship_id' }
    );

  if (upsertErr) {
    return json({ error: 'Failed to save strategy' }, { status: 500 });
  }

  await incrementComprehensiveUsage(session.user.id, 'scholarship_win_strategy');

  return json({ success: true, strategy, cached: false });
};

