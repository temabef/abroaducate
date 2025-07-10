import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CreateCampaignRequest {
  campaign_name: string;
  template_id: string;
  target_segments: string[];
  schedule_for?: string;
}

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

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const requestData: CreateCampaignRequest = await request.json();
    const { campaign_name, template_id, target_segments, schedule_for } = requestData;

    // Validate request data
    if (!campaign_name?.trim()) {
      return json({ error: 'Campaign name is required' }, { status: 400 });
    }

    if (!template_id) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (!target_segments || target_segments.length === 0) {
      return json({ error: 'At least one target segment is required' }, { status: 400 });
    }

    console.log(`📧 Creating campaign: ${campaign_name} for segments: ${target_segments.join(', ')}`);

    // Create campaign using the database function
    const { data: result, error: createError } = await supabase.rpc('create_email_campaign', {
      p_campaign_name: campaign_name.trim(),
      p_template_id: template_id,
      p_target_segments: target_segments,
      p_schedule_for: schedule_for ? new Date(schedule_for).toISOString() : null,
      p_created_by: session.user.id
    });

    if (createError) {
      console.error('Error creating campaign:', createError);
      return json({ error: 'Failed to create campaign: ' + createError.message }, { status: 500 });
    }

    if (!result?.success) {
      return json({ error: result?.error || 'Failed to create campaign' }, { status: 400 });
    }

    console.log(`✅ Campaign created successfully: ${result.campaign_id}`);

    return json({
      success: true,
      campaign_id: result.campaign_id,
      recipient_count: result.recipient_count,
      template_used: result.template_used,
      target_segments: result.target_segments,
      message: `Campaign "${campaign_name}" created successfully with ${result.recipient_count} recipients`
    });

  } catch (error) {
    console.error('Error in campaign creation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 