import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get recent campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('newsletter_campaigns')
      .select('id, campaign_name, subject_line, sent_at, total_recipients, total_sent, total_opens, total_clicks, total_unsubscribes')
      .eq('campaign_status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return json({
      campaigns: campaigns || []
    });

  } catch (error) {
    console.error('Error in recent campaigns endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 