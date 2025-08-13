import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ActivityItem = {
  message: string;
  ts: string;
  type: 'ai' | 'trial' | 'save';
};

export const GET: RequestHandler = async () => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 1) Recent AI feature usage (from ai_usage_log)
    const { data: aiLogs } = await supabaseAdmin
      .from('ai_usage_log')
      .select('feature_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(15);

    // 2) Trials started recently
    const { data: trials } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan_type, current_period_start')
      .eq('status', 'trialing')
      .gte('current_period_start', since)
      .order('current_period_start', { ascending: false })
      .limit(10);

    // 3) Scholarships saved recently
    const { data: saves } = await supabaseAdmin
      .from('user_scholarship_interactions')
      .select('scholarship_id, updated_at, is_saved')
      .eq('is_saved', true)
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(10);

    const items: ActivityItem[] = [];

    const rel = (iso: string) => {
      const diff = Math.max(0, Date.now() - new Date(iso).getTime());
      const s = Math.floor(diff / 1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    };

    for (const log of aiLogs || []) {
      const ft = (log as any).feature_type as string;
      const map: Record<string, string> = {
        sop_generation: 'generated a Statement of Purpose',
        cover_letter_generation: 'created a Cover Letter',
        personal_statement_generation: 'created a Personal Statement',
        academic_cv_generation: 'built an Academic CV',
        text_enhancements: 'improved a document',
        text_enhancement: 'improved a document',
        word_optimizations: 'optimized document wording',
        word_optimization: 'optimized document wording',
        grammar_check: 'fixed grammar issues',
        grammar_checks: 'fixed grammar issues',
        plagiarism_checks: 'ran a plagiarism check',
        plagiarism_check: 'ran a plagiarism check',
        sop_review: 'reviewed an SOP',
        tone_analysis: 'analyzed writing tone',
        improve_text: 'improved a document',
        edit_text: 'edited a document',
        generate_sop: 'generated a Statement of Purpose',
        generate_cover_letter: 'created a Cover Letter',
        generate_personal_statement: 'created a Personal Statement',
        generate_academic_cv: 'built an Academic CV'
      };
      const msg = map[ft] || 'used an AI tool';
      const when = (log as any).created_at;
      items.push({ message: `Someone ${msg} · ${rel(when)}`, ts: when, type: 'ai' });
    }

    for (const t of trials || []) {
      const when = (t as any).current_period_start;
      const plan = ((t as any).plan_type || 'professional');
      items.push({ message: `A ${plan} trial started · ${rel(when)}`, ts: when, type: 'trial' });
    }

    for (const s of saves || []) {
      const when = (s as any).updated_at;
      items.push({ message: `A scholarship was saved · ${rel(when)}`, ts: when, type: 'save' });
    }

    // Sort newest first and limit
    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    const limited = items.slice(0, 20);

    return json({ items: limited });
  } catch (err) {
    console.error('recent-activity error', err);
    return json({ items: [] });
  }
};


