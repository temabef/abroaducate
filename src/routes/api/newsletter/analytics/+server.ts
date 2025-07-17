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

    // Get analytics data from database
    const { data: stats, error: statsError } = await supabase.rpc('get_newsletter_stats');
    
    if (statsError) {
      console.error('Error fetching newsletter stats:', statsError);
      return json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get additional campaign stats
    const { data: campaignStats, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('total_sent, total_opens, total_clicks, total_unsubscribes')
      .eq('campaign_status', 'sent');

    if (campaignError) {
      console.error('Error fetching campaign stats:', campaignError);
    }

    // Calculate totals from campaigns
    const totalSent = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_sent || 0), 0) || 0;
    const totalOpens = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_opens || 0), 0) || 0;
    const totalClicks = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_clicks || 0), 0) || 0;
    const totalUnsubscribes = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_unsubscribes || 0), 0) || 0;

    return json({
      total_subscribers: stats?.total_subscribers || 0,
      active_subscribers: stats?.active_subscribers || 0,
      total_sent: totalSent,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      total_unsubscribes: totalUnsubscribes
    });

  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 