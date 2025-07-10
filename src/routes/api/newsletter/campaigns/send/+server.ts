import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SendCampaignRequest {
  campaign_id: string;
  send_immediately: boolean;
  batch_size?: number;
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

    const requestData: SendCampaignRequest = await request.json();
    const { campaign_id, send_immediately, batch_size = 100 } = requestData;

    // Validate request data
    if (!campaign_id) {
      return json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    console.log(`📤 ${send_immediately ? 'Sending' : 'Scheduling'} campaign: ${campaign_id}`);

    // Send campaign using the database function
    const { data: result, error: sendError } = await supabase.rpc('send_email_campaign', {
      p_campaign_id: campaign_id,
      p_send_immediately: send_immediately,
      p_batch_size: batch_size
    });

    if (sendError) {
      console.error('Error sending campaign:', sendError);
      return json({ error: 'Failed to send campaign: ' + sendError.message }, { status: 500 });
    }

    if (!result?.success) {
      return json({ error: result?.error || 'Failed to send campaign' }, { status: 400 });
    }

    const actionText = send_immediately ? 'sent' : 'scheduled';
    console.log(`✅ Campaign ${actionText} successfully: ${campaign_id}`);

    // Prepare response based on whether it was sent immediately or scheduled
    const response: any = {
      success: true,
      campaign_id: result.campaign_id,
      total_recipients: result.total_recipients,
      campaign_status: result.campaign_status,
      message: `Campaign ${actionText} successfully`
    };

    if (send_immediately && result.batch_sent !== undefined) {
      response.batch_sent = result.batch_sent;
      response.remaining = result.remaining;
      response.message = `Campaign started! Sent to ${result.batch_sent} recipients, ${result.remaining} remaining in queue.`;
    }

    return json(response);

  } catch (error) {
    console.error('Error in campaign send:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 