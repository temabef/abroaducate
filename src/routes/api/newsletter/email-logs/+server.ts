import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    const campaign_id = url.searchParams.get('campaign_id');
    if (!campaign_id) {
      return json({ error: 'campaign_id is required' }, { status: 400 });
    }
    const { data: logs, error: logsError } = await supabase
      .from('newsletter_email_logs')
      .select('email_address, status, sent_at')
      .eq('campaign_id', campaign_id)
      .order('sent_at', { ascending: true });
    if (logsError) {
      console.error('Error fetching email logs:', logsError);
      return json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
    return json({ logs: logs || [] });
  } catch (error) {
    console.error('Error in email logs endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 