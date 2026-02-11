import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getAIModelForUser } from '$lib/ai-models';
import {
  checkComprehensiveUsageLimit,
  incrementComprehensiveUsage
} from '$lib/comprehensive-usage-limits.server';
import {
  computeScholarshipSourceHash,
  generateScholarshipWinStrategy
} from '$lib/server/scholarshipWinStrategy.server';

const MAX_IDS_PER_REQUEST = 10;

const bodySchema = z.object({
  scholarship_ids: z.array(z.string().min(1)).min(1).max(MAX_IDS_PER_REQUEST)
});

export const POST: RequestHandler = async ({
  request,
  locals: { getSession, supabaseServiceRole }
}) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'Invalid input',
        details: parsed.error.flatten(),
        max_ids: MAX_IDS_PER_REQUEST
      },
      { status: 400 }
    );
  }

  const { scholarship_ids } = parsed.data;

  // Paid gating: free = 0
  const initialUsage = await checkComprehensiveUsageLimit(
    session.user.id,
    'scholarship_win_strategy'
  );
  if (!initialUsage.allowed) {
    return json(
      {
        error: 'Upgrade required',
        message: initialUsage.message || 'This feature requires a paid plan.',
        planType: initialUsage.planType,
        upgradeRequired: true
      },
      { status: 403 }
    );
  }

  const model = await getAIModelForUser(supabaseServiceRole as any, session.user.id);
  const results: { scholarship_id: string; success: boolean; cached?: boolean; error?: string }[] =
    [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let limitReached = false;

  for (const scholarship_id of scholarship_ids) {
    const usage = await checkComprehensiveUsageLimit(
      session.user.id,
      'scholarship_win_strategy'
    );
    if (!usage.allowed) {
      limitReached = true;
      results.push({
        scholarship_id,
        success: false,
        error: usage.message || 'Monthly limit reached'
      });
      failed += 1;
      continue;
    }

    const { data: scholarship, error: sErr } = await supabaseServiceRole
      .from('public_scholarships_decoded')
      .select('*')
      .eq('id', scholarship_id)
      .single();

    if (sErr || !scholarship) {
      results.push({ scholarship_id, success: false, error: 'Scholarship not found' });
      failed += 1;
      continue;
    }

    const sourceHash = computeScholarshipSourceHash(scholarship);

    const { data: existing } = await supabaseServiceRole
      .from('scholarship_win_strategies')
      .select('id, strategy, source_hash')
      .eq('scholarship_id', scholarship_id)
      .maybeSingle();

    if (existing?.strategy && existing.source_hash === sourceHash) {
      results.push({ scholarship_id, success: true, cached: true });
      skipped += 1;
      continue;
    }

    try {
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
        results.push({ scholarship_id, success: false, error: 'Failed to save strategy' });
        failed += 1;
        continue;
      }

      await incrementComprehensiveUsage(session.user.id, 'scholarship_win_strategy');
      results.push({ scholarship_id, success: true, cached: false });
      generated += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      results.push({ scholarship_id, success: false, error: msg });
      failed += 1;
    }
  }

  return json({
    generated,
    skipped,
    failed,
    limit_reached: limitReached,
    results
  });
};
