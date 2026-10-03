import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { testZohoConnection, processZohoInbox } from '$lib/server/ai-email-agent/zoho-client';
import { env } from '$env/dynamic/private';

/**
 * GET: Tests connection to Zoho Mailbox and checks unread count.
 */
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const status = await testZohoConnection();
		return json(status);
	} catch (err: any) {
		return json({
			success: false,
			imapConnected: false,
			smtpConnected: false,
			error: err?.message || 'Failed to connect to Zoho Mail'
		}, { status: 500 });
	}
};

/**
 * POST: Triggers reading unread emails from Zoho and replying autonomously.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	const authHeader = request.headers.get('authorization') || '';
	const cronSecret = env.CRON_SECRET || (process.env as any)?.CRON_SECRET;
	const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

	if (!session?.user && !isCronAuthorized) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const limit = Math.min(Number(body.limit) || 10, 50);
		const dryRun = Boolean(body.dryRun);

		const result = await processZohoInbox({
			limit,
			dryRun,
			forceAutonomous: true
		});

		return json({
			success: true,
			result
		});
	} catch (err: any) {
		console.error('[ZOHO_POLL_ENDPOINT] Error:', err);
		return json({
			success: false,
			error: err?.message || 'Error processing Zoho emails'
		}, { status: 500 });
	}
};
