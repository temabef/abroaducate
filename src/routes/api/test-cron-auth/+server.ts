import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ platform, request }) => {
  const auth = request.headers.get('authorization') ?? '';
  const cronSecret = env.CRON_SECRET || (platform?.env as any)?.CRON_SECRET;
  
  const platformKeys = platform?.env ? Object.keys(platform.env) : [];
  const privateEnvKeys = Object.keys(env);
  
  const url = ((platform?.env as any)?.PUBLIC_SUPABASE_URL || 'https://yiubrielkgrzcwdabepp.supabase.co').trim();
  const rawKey = (platform?.env as any)?.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
  const cleanKey = rawKey.replace(/[^A-Za-z0-9\-_.]/g, '');
  const parts = cleanKey.split('.');
  let payloadDecoded: any = null;
  if (parts.length >= 2) {
    try {
      const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      payloadDecoded = JSON.parse(decoded);
    } catch (e: any) {
      payloadDecoded = { error: e.message };
    }
  }

  let testResult: any = null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, cleanKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error: sbError } = await sb.from('programs').select('id').limit(1);
    testResult = { ok: !sbError, error: sbError?.message, hasData: !!data?.length };
  } catch (err: any) {
    testResult = { ok: false, error: err.message };
  }

  return json({
    hasEnvCronSecret: !!env.CRON_SECRET,
    hasPlatformCronSecret: !!(platform?.env as any)?.CRON_SECRET,
    authMatches: !!cronSecret && auth === `Bearer ${cronSecret}`,
    url,
    rawKeyLength: rawKey.length,
    partLengths: parts.map(p => p.length),
    payloadDecoded,
    testResult
  });
};
