import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import sgMail from '@sendgrid/mail';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@abroaducate.com';

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { subject, html, campaign_id, batch_size } = await request.json();
    const batchSize = batch_size || 500;
    if (!subject || !html) {
      return json({ error: 'Subject and HTML content are required' }, { status: 400 });
    }
    if (!sendgridApiKey) {
      return json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    let campaign = null;
    let campaignId = campaign_id;
    if (!campaignId) {
      // Create new campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from('newsletter_campaigns')
        .insert({
          campaign_name: subject,
          subject_line: subject,
          campaign_type: 'announcement',
          html_content: html,
          target_status: 'active',
          campaign_status: 'sending',
          total_recipients: 0, // will update after batch
          created_by: session.user.id
        })
        .select()
        .single();
      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
        return json({ error: 'Failed to create campaign' }, { status: 500 });
      }
      campaign = newCampaign;
      campaignId = newCampaign.id;
    } else {
      // Fetch existing campaign
      const { data: existingCampaign, error: fetchError } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (fetchError || !existingCampaign) {
        return json({ error: 'Campaign not found' }, { status: 404 });
      }
      campaign = existingCampaign;
    }

    // Get next batch of subscribers who have NOT been sent this campaign
    const { data: alreadySent, error: sentError } = await supabase
      .from('newsletter_email_logs')
      .select('subscriber_id')
      .eq('campaign_id', campaignId);
    const sentIds = alreadySent ? alreadySent.map(row => row.subscriber_id) : [];

    let query = supabase
      .from('newsletter_subscribers')
      .select('id, email')
      .eq('status', 'active');
    if (sentIds.length > 0) {
      query = query.not('id', 'in', `(${sentIds.join(',')})`);
    }
    query = query.limit(batchSize);
    const { data: batch, error: batchError } = await query;
    if (batchError) {
      console.error('Error fetching batch:', batchError);
      return json({ error: 'Failed to fetch batch' }, { status: 500 });
    }
    if (!batch || batch.length === 0) {
      // All done
      await supabase
        .from('newsletter_campaigns')
        .update({
          campaign_status: 'sent',
          sent_at: new Date().toISOString(),
          total_sent: sentIds.length
        })
        .eq('id', campaignId);
      return json({
        success: true,
        message: 'All subscribers have been sent to.',
        campaign_id: campaignId,
        sent_count: sentIds.length,
        done: true
      });
    }

    // Send emails in this batch
    let sentCount = 0;
    let failedCount = 0;
    const logs = [];
    const messages = batch.map(subscriber => ({
      to: subscriber.email,
      from: fromEmail,
      subject: subject,
      html: html,
      trackingSettings: {
        clickTracking: { enable: true, enableText: true },
        openTracking: { enable: true }
      }
    }));
    try {
      await sgMail.send(messages);
      sentCount = batch.length;
    } catch (sendError) {
      console.error('Error sending batch:', sendError);
      failedCount = batch.length;
    }
    // Log each send
    for (const subscriber of batch) {
      logs.push({
        subscriber_id: subscriber.id,
        campaign_id: campaignId,
        email_address: subscriber.email,
        subject_line: subject,
        email_type: 'newsletter',
        status: sentCount > 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      });
    }
    if (logs.length > 0) {
      await supabase.from('newsletter_email_logs').insert(logs);
    }
    // Update campaign progress
    const totalSent = sentIds.length + sentCount;
    await supabase
      .from('newsletter_campaigns')
      .update({
        total_sent: totalSent,
        campaign_status: 'sending',
        total_failed: campaign.total_failed + failedCount
      })
      .eq('id', campaignId);
    // Optionally update total_recipients if this is the first batch
    if (!campaign_id) {
      const { count } = await supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      await supabase
        .from('newsletter_campaigns')
        .update({ total_recipients: count || 0 })
        .eq('id', campaignId);
    }
    return json({
      success: true,
      campaign_id: campaignId,
      sent_count: totalSent,
      batch_sent: sentCount,
      batch_failed: failedCount,
      total_recipients: campaign.total_recipients,
      done: false
    });
  } catch (error) {
    console.error('Error in batch send endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 