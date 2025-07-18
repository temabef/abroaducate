import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get sent count from email logs
    const { count: sentCount, error: countError } = await supabase
      .from('newsletter_email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .eq('status', 'sent');

    if (countError) {
      console.error('Error counting sent emails:', countError);
    }

    // Check if campaign is done
    const { count: totalRecipients } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const done = (sentCount || 0) >= (totalRecipients || 0);

    return json({
      success: true,
      campaign_id: id,
      sent_count: sentCount || 0,
      total_recipients: totalRecipients || 0,
      done: done,
      campaign_status: campaign.campaign_status,
      subject_line: campaign.subject_line
    });

  } catch (error) {
    console.error('Error getting campaign status:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 