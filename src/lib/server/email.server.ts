/**
 * Shared Customer.io email helper.
 *
 * Uses the Transactional API (APIClient + SendEmailRequest) for all
 * one-off and batch emails. This replaces every SendGrid usage on the platform.
 *
 * Required env vars:
 *   CUSTOMER_IO_SITE_ID   — from Customer.io → Settings → API Credentials
 *   CUSTOMER_IO_API_KEY   — same page (the "App API Key", not the tracking key)
 *
 * Customer.io transactional docs:
 *   https://customer.io/docs/api/app/#operation/sendEmail
 */

import { APIClient, SendEmailRequest, RegionEU } from 'customerio-node';
import { env } from '$env/dynamic/private';

const FROM_NAME = 'Abroaducate';
const FROM_EMAIL = 'hello@abroaducate.com';

function getClient(): APIClient {
	const apiKey = env.CUSTOMER_IO_API_KEY;
	if (!apiKey) throw new Error('CUSTOMER_IO_API_KEY is not set');
	return new APIClient(apiKey, { region: RegionEU });
}

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	fromName?: string;
	fromEmail?: string;
}

/**
 * Send a single transactional email via Customer.io.
 * Returns { success: true } or { success: false, error: string }.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
	try {
		const client = getClient();
		const req = new SendEmailRequest({
			to: opts.to,
			from: `${opts.fromName ?? FROM_NAME} <${opts.fromEmail ?? FROM_EMAIL}>`,
			subject: opts.subject,
			body: opts.html,
			identifiers: { email: opts.to },
		});
		await client.sendEmail(req);
		console.log(`[EMAIL] ✅ Sent to ${opts.to}: ${opts.subject}`);
		return { success: true };
	} catch (err: any) {
		const msg = err?.message ?? String(err);
		console.error(`[EMAIL] ❌ Failed to send to ${opts.to}:`, msg);
		return { success: false, error: msg };
	}
}

/**
 * Send the same email to multiple recipients sequentially.
 * Returns counts of successes and failures.
 */
export async function sendBulkEmail(
	recipients: string[],
	subject: string,
	html: string,
	text?: string
): Promise<{ sent: number; failed: number }> {
	let sent = 0;
	let failed = 0;
	for (const to of recipients) {
		const result = await sendEmail({ to, subject, html, text });
		if (result.success) sent++;
		else failed++;
	}
	return { sent, failed };
}
