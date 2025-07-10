import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Check admin authorization
async function checkAdminAccess(supabaseClient: any): Promise<boolean> {
  try {
    const { data: canManageContent, error } = await supabaseClient.rpc('can_manage_content');
    
    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
    
    return !!canManageContent;
  } catch (error) {
    console.error('Error in admin access check:', error);
    return false;
  }
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('📊 Loading campaign dashboard data...');

    // Get campaign dashboard data using the database function
    const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_campaign_dashboard');

    if (dashboardError) {
      console.error('Error loading campaign dashboard:', dashboardError);
      return json({ error: 'Failed to load dashboard data' }, { status: 500 });
    }

    console.log(`✅ Dashboard loaded: ${dashboardData?.recent_campaigns?.length || 0} campaigns`);

    return json({
      success: true,
      recent_campaigns: dashboardData?.recent_campaigns || [],
      summary: dashboardData?.summary || {
        total_campaigns: 0,
        active_campaigns: 0,
        sent_campaigns: 0,
        total_emails_sent: 0,
        avg_open_rate: 0
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in campaign dashboard:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 