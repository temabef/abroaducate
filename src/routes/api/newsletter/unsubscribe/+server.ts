import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Create admin client
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface UnsubscribeRequest {
  email: string;
  type: 'all' | 'digest' | 'marketing';
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData: UnsubscribeRequest = await request.json();
    const { email, type } = requestData;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Validate unsubscribe type
    if (!type || !['all', 'digest', 'marketing'].includes(type)) {
      return json({ error: 'Valid unsubscribe type is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log(`📧 Processing unsubscribe request for ${cleanEmail} (type: ${type})`);

    // Check if subscriber exists
    const { data: subscriber, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscriber:', fetchError);
      return json({ error: 'Database error occurred' }, { status: 500 });
    }

    if (!subscriber) {
      // Email not found in newsletter subscribers
      return json({ 
        success: true, 
        message: 'If this email was subscribed to our newsletter, it has been successfully unsubscribed.',
        already_unsubscribed: true
      });
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };
    let message = '';

    // Handle different unsubscribe types
    switch (type) {
      case 'all':
        updateData.status = 'unsubscribed';
        updateData.unsubscribed_at = new Date().toISOString();
        updateData.scholarship_digest = false;
        updateData.weekly_updates = false;
        updateData.marketing_emails = false;
        message = 'You have been successfully unsubscribed from all our email communications.';
        break;

      case 'digest':
        updateData.scholarship_digest = false;
        message = 'You have been unsubscribed from scholarship digest emails. You may still receive other communications.';
        break;

      case 'marketing':
        updateData.marketing_emails = false;
        updateData.weekly_updates = false;
        message = 'You have been unsubscribed from marketing and promotional emails. You may still receive scholarship digests.';
        break;
    }

    // Update subscriber preferences
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update(updateData)
      .eq('email', cleanEmail);

    if (updateError) {
      console.error('Error updating subscriber:', updateError);
      return json({ error: 'Failed to process unsubscribe request' }, { status: 500 });
    }

    // Log the unsubscribe action
    try {
      await supabase
        .from('newsletter_email_logs')
        .insert({
          email_address: cleanEmail,
          subject_line: `Unsubscribe: ${type}`,
          email_type: 'unsubscribe',
          status: 'sent',
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging unsubscribe action:', logError);
      // Don't fail the request if logging fails
    }

    console.log(`✅ Successfully processed ${type} unsubscribe for ${cleanEmail}`);

    return json({
      success: true,
      message,
      unsubscribe_type: type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Newsletter unsubscribe error:', error);
    return json(
      { 
        error: 'Failed to process unsubscribe request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// GET: Check subscription status
export const GET: RequestHandler = async ({ url }) => {
  try {
    const email = url.searchParams.get('email');

    if (!email || !isValidEmail(email)) {
      return json({ error: 'Valid email parameter is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Get subscriber information
    const { data: subscriber, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscriber:', fetchError);
      return json({ error: 'Database error occurred' }, { status: 500 });
    }

    if (!subscriber) {
      return json({
        success: true,
        subscribed: false,
        message: 'Email address not found in our newsletter'
      });
    }

    // Return subscription status
    return json({
      success: true,
      subscribed: subscriber.status === 'active',
      preferences: {
        scholarship_digest: subscriber.scholarship_digest,
        weekly_updates: subscriber.weekly_updates,
        marketing_emails: subscriber.marketing_emails
      },
      subscription_info: {
        source: subscriber.source,
        subscribed_at: subscriber.subscribed_at,
        last_email_sent: subscriber.last_email_sent,
        total_emails_sent: subscriber.total_emails_sent,
        status: subscriber.status
      }
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return json({ error: 'Failed to check subscription status' }, { status: 500 });
  }
}; 