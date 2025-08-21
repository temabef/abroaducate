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

    // Get detailed unsubscribe analytics
    const { data: unsubscribeData, error: unsubError } = await supabase
      .from('newsletter_subscribers')
      .select('status, unsubscribed_at, scholarship_digest, weekly_updates, marketing_emails, source')
      .eq('status', 'unsubscribed')
      .order('unsubscribed_at', { ascending: false });

    if (unsubError) {
      console.error('Error fetching unsubscribe data:', unsubError);
      return json({ error: 'Failed to fetch unsubscribe analytics' }, { status: 500 });
    }

    // Get recent unsubscribe logs with reasons
    const { data: unsubscribeLogs, error: logsError } = await supabase
      .from('newsletter_email_logs')
      .select('email_address, subject_line, sent_at')
      .eq('email_type', 'unsubscribe')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Error fetching unsubscribe logs:', logsError);
    }

    // Calculate unsubscribe statistics
    const totalUnsubscribes = unsubscribeData?.length || 0;
    
    // Group by source
    const unsubscribesBySource = unsubscribeData?.reduce((acc, sub) => {
      const source = sub.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by month for trends
    const unsubscribesByMonth = unsubscribeData?.reduce((acc, sub) => {
      if (sub.unsubscribed_at) {
        const month = new Date(sub.unsubscribed_at).toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Parse unsubscribe types from logs
    const unsubscribeTypes = {
      all: 0,
      digest: 0,
      marketing: 0
    };

    unsubscribeLogs?.forEach(log => {
      const type = log.subject_line?.split(': ')[1];
      if (type && type in unsubscribeTypes) {
        unsubscribeTypes[type as keyof typeof unsubscribeTypes]++;
      }
    });

    // Recent unsubscribes with formatted data
    const recentUnsubscribes = unsubscribeLogs?.map(log => ({
      email: log.email_address,
      type: log.subject_line?.split(': ')[1] || 'unknown',
      date: log.sent_at,
      formatted_date: new Date(log.sent_at).toLocaleDateString()
    })) || [];

    return json({
      total_unsubscribes: totalUnsubscribes,
      unsubscribe_types: unsubscribeTypes,
      unsubscribes_by_source: unsubscribesBySource,
      unsubscribes_by_month: unsubscribesByMonth,
      recent_unsubscribes: recentUnsubscribes,
      unsubscribe_rate: 0, // Will be calculated when we have sent email data
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in unsubscribe analytics endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
