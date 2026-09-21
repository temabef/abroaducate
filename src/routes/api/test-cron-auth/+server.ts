import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ platform, request }) => {
  const auth = request.headers.get('authorization') ?? '';
  const cronSecret = env.CRON_SECRET || (platform?.env as any)?.CRON_SECRET;
  
  const platformKeys = platform?.env ? Object.keys(platform.env) : [];
  
  return json({
    hasEnvCronSecret: !!env.CRON_SECRET,
    hasPlatformCronSecret: !!(platform?.env as any)?.CRON_SECRET,
    authMatches: !!cronSecret && auth === `Bearer ${cronSecret}`,
    platformKeys: platformKeys.filter(k => !k.includes('KEY') && !k.includes('SECRET')),
    hasServiceRoleKey: !!(env.SUPABASE_SERVICE_ROLE_KEY || (platform?.env as any)?.SUPABASE_SERVICE_ROLE_KEY),
    receivedAuthLength: auth.length
  });
};
