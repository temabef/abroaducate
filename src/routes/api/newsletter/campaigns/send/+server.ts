/**
 * Send or schedule a newsletter campaign.
 * Replaced SendGrid with Customer.io for the test-email path.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sendEmail } from '$lib/server/email.server';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SendCampaignRequest {
	campaign_id: string;
	send_immediately: boolean;
	batch_size?: number;
	test_email?: string;
}

async function checkAdminAccess(supabaseClient: any): Promise<boolean> {
	try {
		const { data, error } = await supabaseClient.rpc('can_manage_content');
		return !error && !!data;
	} catch {
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

		const { campaign_id, send_immediately, batch_size = 100, test_email }: SendCampaignRequest = await request.json();

		if (!campaign_id) {
			return json({ error: 'Campaign ID is required' }, { status: 400 });
		}

		// Test send path — send only to the provided address
		if (test_email) {
			const { data: campaign, error: campaignError } = await supabase
				.from('newsletter_campaigns')
				.select('subject_line, html_content, text_content')
				.eq('id', campaign_id)
				.single();

			if (campaignError || !campaign) {
				return json({ error: 'Failed to fetch campaign details' }, { status: 400 });
			}

			const result = await sendEmail({
				to: test_email,
				subject: campaign.subject_line,
				html: campaign.html_content,
				text: campaign.text_content ?? undefined
			});

			if (result.success) {
				return json({ success: true, message: `Test email sent to ${test_email}` });
			} else {
				return json({ error: 'Failed to send test email: ' + result.error }, { status: 500 });
			}
		}

		// Full campaign send via DB function
		const { data: result, error: sendError } = await supabase.rpc('send_email_campaign', {
			p_campaign_id: campaign_id,
			p_send_immediately: send_immediately,
			p_batch_size: batch_size
		});

		if (sendError) {
			return json({ error: 'Failed to send campaign: ' + sendError.message }, { status: 500 });
		}
		if (!result?.success) {
			return json({ error: result?.error || 'Failed to send campaign' }, { status: 400 });
		}

		const actionText = send_immediately ? 'sent' : 'scheduled';
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
			response.message = `Campaign started! Sent to ${result.batch_sent} recipients, ${result.remaining} remaining.`;
		}
		return json(response);

	} catch (error: any) {
		console.error('Error in campaign send:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
