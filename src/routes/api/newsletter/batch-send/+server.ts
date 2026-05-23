/**
 * Newsletter batch send — sends a campaign to newsletter_subscribers in batches.
 * Replaced SendGrid with Customer.io; all campaign/logging logic preserved.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sendEmail } from '$lib/server/email.server';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

		console.log('📧 Newsletter batch send started:', { subject, batchSize });

		let campaign = null;
		let campaignId = campaign_id;

		if (!campaignId) {
			const { data: newCampaign, error: campaignError } = await supabase
				.from('newsletter_campaigns')
				.insert({
					campaign_name: subject,
					subject_line: subject,
					campaign_type: 'announcement',
					html_content: html,
					target_status: 'active',
					campaign_status: 'sending',
					total_recipients: 0,
					created_by: session.user.id
				})
				.select()
				.single();

			if (campaignError) {
				return json({ error: 'Failed to create campaign: ' + campaignError.message }, { status: 500 });
			}
			campaign = newCampaign;
			campaignId = newCampaign.id;
		} else {
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

		// Get subscribers not yet sent in this campaign
		const { data: alreadySent } = await supabase
			.from('newsletter_email_logs')
			.select('subscriber_id')
			.eq('campaign_id', campaignId);
		const sentIds = (alreadySent ?? []).map((r: any) => r.subscriber_id);

		let query = supabase.from('newsletter_subscribers').select('id, email').eq('status', 'active');
		if (sentIds.length > 0) {
			query = query.not('id', 'in', `(${sentIds.join(',')})`);
		}
		query = query.limit(batchSize);

		const { data: batch, error: batchError } = await query;
		if (batchError) {
			return json({ error: 'Failed to fetch batch: ' + batchError.message }, { status: 500 });
		}

		if (!batch || batch.length === 0) {
			await supabase
				.from('newsletter_campaigns')
				.update({ campaign_status: 'sent', sent_at: new Date().toISOString(), total_sent: sentIds.length })
				.eq('id', campaignId);
			return json({ success: true, message: 'All subscribers sent.', campaign_id: campaignId, sent_count: sentIds.length, done: true });
		}

		// Send via Customer.io
		let sentCount = 0;
		let failedCount = 0;
		const logs: any[] = [];

		for (const subscriber of batch) {
			const result = await sendEmail({ to: subscriber.email, subject, html });
			if (result.success) sentCount++;
			else failedCount++;
			logs.push({
				subscriber_id: subscriber.id,
				campaign_id: campaignId,
				email_address: subscriber.email,
				subject_line: subject,
				email_type: 'newsletter',
				status: result.success ? 'sent' : 'failed',
				sent_at: new Date().toISOString()
			});
		}

		if (logs.length > 0) {
			await supabase.from('newsletter_email_logs').insert(logs);
		}

		const totalSent = sentIds.length + sentCount;
		await supabase
			.from('newsletter_campaigns')
			.update({ total_sent: totalSent, campaign_status: 'sending', total_failed: (campaign.total_failed ?? 0) + failedCount })
			.eq('id', campaignId);

		return json({ success: true, campaign_id: campaignId, batch_sent: sentCount, total_sent: totalSent, done: false });

	} catch (e: any) {
		console.error('❌ Newsletter batch send exception:', e);
		return json({ error: e.message || 'Internal server error', exception: true }, { status: 500 });
	}
};
