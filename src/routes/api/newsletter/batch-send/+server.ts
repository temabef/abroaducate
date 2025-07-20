import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import sgMail from '@sendgrid/mail';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromName = process.env.FROM_NAME || 'Abroaducate';
const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'hello@abroaducate.com';
const from = `${fromName} <${fromEmail}>`;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { subject, html, campaign_id, batch_size, total_recipients } = await request.json();
    const batchSize = batch_size || 500;
    if (!subject || !html) {
      return json({ error: 'Subject and HTML content are required' }, { status: 400 });
    }
    
    // Enhanced SendGrid configuration check
    if (!sendgridApiKey) {
      console.error('SendGrid API key not configured');
      return json({ 
        error: 'SendGrid API key not configured. Please check your environment variables.',
        details: 'SENDGRID_API_KEY environment variable is missing or empty'
      }, { status: 500 });
    }

    console.log('📧 Newsletter batch send started:', {
      subject,
      batchSize,
      hasApiKey: !!sendgridApiKey,
      fromEmail,
      fromName
    });

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
        return json({ error: 'Failed to create campaign: ' + campaignError.message }, { status: 500 });
      }
      campaign = newCampaign;
      campaignId = newCampaign.id;
      console.log('✅ Campaign created:', campaignId);
    } else {
      // Fetch existing campaign
      const { data: existingCampaign, error: fetchError } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (fetchError || !existingCampaign) {
        console.error('Campaign not found:', campaignId);
        return json({ error: 'Campaign not found' }, { status: 404 });
      }
      campaign = existingCampaign;
      console.log('✅ Using existing campaign:', campaignId);
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
      return json({ error: 'Failed to fetch batch: ' + batchError.message }, { status: 500 });
    }
    
    console.log('📧 Batch details:', {
      batchSize: batch?.length || 0,
      alreadySent: sentIds.length,
      totalRecipients: total_recipients
    });

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
      from: from,
      subject: subject,
      html: html,
      trackingSettings: {
        clickTracking: { enable: true, enableText: true },
        openTracking: { enable: true }
      }
    }));
    
    console.log('📧 Attempting to send batch via SendGrid...');
    try {
      await sgMail.send(messages);
      sentCount = batch.length;
      console.log('✅ SendGrid batch sent successfully:', sentCount);
    } catch (sendError) {
      console.error('❌ SendGrid batch send failed:', sendError);
      failedCount = batch.length;
      
      // Return detailed error information
      return json({ 
        error: 'Failed to send emails via SendGrid',
        details: sendError instanceof Error ? sendError.message : 'Unknown SendGrid error',
        sendgridError: true,
        batchSize: batch.length
      }, { status: 500 });
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
      const { error: logError } = await supabase.from('newsletter_email_logs').insert(logs);
      if (logError) {
        console.error('Error logging email sends:', logError);
      } else {
        console.log('✅ Email logs saved:', logs.length);
      }
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

    console.log('✅ Campaign updated:', {
      campaignId,
      totalSent,
      batchSent: sentCount,
      failed: failedCount
    });

    return json({
      success: true,
      campaign_id: campaignId,
      batch_sent: sentCount,
      total_sent: totalSent,
      done: false
    });
  } catch (e) {
    console.error('❌ Newsletter batch send exception:', e);
    return json({ 
      error: e.message || 'Internal server error',
      exception: true
    }, { status: 500 });
  }
}; 