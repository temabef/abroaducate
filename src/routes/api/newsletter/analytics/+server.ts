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

    // Get actual unsubscribe counts from newsletter_subscribers table
    const { data: unsubscribeStats, error: unsubError } = await supabase
      .from('newsletter_subscribers')
      .select('status, unsubscribed_at')
      .eq('status', 'unsubscribed');

    if (unsubError) {
      console.error('Error fetching unsubscribe stats:', unsubError);
    }

    // Get unsubscribe breakdown by type from email logs
    const { data: unsubscribeTypes, error: typesError } = await supabase
      .from('newsletter_email_logs')
      .select('subject_line')
      .eq('email_type', 'unsubscribe');

    if (typesError) {
      console.error('Error fetching unsubscribe types:', typesError);
    }

    // Count unsubscribe types
    const unsubscribeBreakdown = {
      all: 0,
      digest: 0,
      marketing: 0
    };

    unsubscribeTypes?.forEach(log => {
      const type = log.subject_line?.split(': ')[1];
      if (type && unsubscribeBreakdown.hasOwnProperty(type)) {
        unsubscribeBreakdown[type as keyof typeof unsubscribeBreakdown]++;
      }
    });

    // Get additional campaign stats for sent/opens/clicks (if any campaigns exist)
    const { data: campaignStats, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('total_sent, total_opens, total_clicks')
      .eq('campaign_status', 'sent');

    if (campaignError) {
      console.error('Error fetching campaign stats:', campaignError);
    }

    // Calculate totals from campaigns
    const totalSent = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_sent || 0), 0) || 0;
    const totalOpens = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_opens || 0), 0) || 0;
    const totalClicks = campaignStats?.reduce((sum, campaign) => sum + (campaign.total_clicks || 0), 0) || 0;
    const totalUnsubscribes = unsubscribeStats?.length || 0;

    return json({
      total_subscribers: stats?.total_subscribers || 0,
      active_subscribers: stats?.active_subscribers || 0,
      total_sent: totalSent,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      total_unsubscribes: totalUnsubscribes,
      unsubscribe_breakdown: unsubscribeBreakdown,
      unsubscribed_count: totalUnsubscribes // Alias for clarity
    });

  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 