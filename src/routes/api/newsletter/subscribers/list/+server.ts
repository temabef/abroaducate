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

    // Get subscribers list
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, status, subscribed_at, source')
      .order('subscribed_at', { ascending: false })
      .limit(50); // Limit to prevent overwhelming the UI

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    return json({
      subscribers: subscribers || []
    });

  } catch (error) {
    console.error('Error in subscribers list endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 