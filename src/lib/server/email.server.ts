/**
 * Shared Customer.io email helper.
 *
 * Uses the Transactional API & Track API via standard Web fetch for Cloudflare Workers compatibility.
 * This completely avoids Node.js `https.request` / `unenv` polyfill limitations on Cloudflare Workers.
 *
 * Required env vars:
 *   CUSTOMER_IO_SITE_ID   — from Customer.io → Settings → API Credentials
 *   CUSTOMER_IO_API_KEY   — same page (the "App API Key", not the tracking key)
 *   CUSTOMER_IO_TRACK_API_KEY — tracking key (optional, falls back to API key)
 */

import { env } from '$env/dynamic/private';

const FROM_NAME = 'Abroaducate';
const FROM_EMAIL = 'hello@abroaducate.com';
const CIO_API_URL = 'https://api-eu.customer.io/v1';
const CIO_TRACK_URL = 'https://track-eu.customer.io/api/v1';

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	fromName?: string;
	fromEmail?: string;
	replyTo?: string;
	bcc?: string;
	inReplyTo?: string;
	references?: string | string[];
	headers?: Record<string, string>;
}

/**
 * Helper to encode credentials for Basic Auth across environments.
 */
function getBasicAuth(siteId: string, apiKey: string): string {
	if (typeof btoa === 'function') {
		return 'Basic ' + btoa(`${siteId}:${apiKey}`);
	}
	return 'Basic ' + Buffer.from(`${siteId}:${apiKey}`).toString('base64');
}

/**
 * Identify or update a customer profile in Customer.io Track API.
 * This ensures the user is visible under Customer.io "People" for broadcasts and campaigns.
 */
export async function identifyUser(
	userId: string,
	attributes: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
	try {
		const siteId = env.CUSTOMER_IO_SITE_ID;
		const trackKey = env.CUSTOMER_IO_TRACK_API_KEY || env.CUSTOMER_IO_API_KEY;
		if (!siteId || !trackKey) {
			console.warn('[CUSTOMER.IO] ⚠️ Cannot identify user: missing CUSTOMER_IO_SITE_ID or track key');
			return { success: false, error: 'Missing Customer.io credentials' };
		}

		const res = await fetch(`${CIO_TRACK_URL}/customers/${encodeURIComponent(userId)}`, {
			method: 'PUT',
			headers: {
				Authorization: getBasicAuth(siteId, trackKey),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(attributes)
		});

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Customer.io Track API error [${res.status}]: ${errText}`);
		}

		console.log(`[CUSTOMER.IO] ✅ Identified user ${userId} (${attributes.email ?? ''})`);
		return { success: true };
	} catch (err: any) {
		const msg = err?.message ?? String(err);
		console.error(`[CUSTOMER.IO] ❌ Failed to identify user ${userId}:`, msg);
		return { success: false, error: msg };
	}
}

/**
 * Send a single transactional email via Customer.io.
 * Returns { success: true } or { success: false, error: string }.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
	try {
		const apiKey = env.CUSTOMER_IO_API_KEY;
		if (!apiKey) throw new Error('CUSTOMER_IO_API_KEY is not set');

		const reqPayload: Record<string, any> = {
			to: opts.to,
			from: `${opts.fromName ?? FROM_NAME} <${opts.fromEmail ?? FROM_EMAIL}>`,
			subject: opts.subject,
			body: opts.html,
			identifiers: { email: opts.to }
		};

		if (opts.text) {
			reqPayload.body_plain = opts.text;
		}

		if (opts.replyTo) {
			reqPayload.reply_to = opts.replyTo;
		}

		// Attach BCC only if different from recipient
		if (opts.bcc && opts.bcc.toLowerCase().trim() !== opts.to.toLowerCase().trim()) {
			reqPayload.bcc = opts.bcc.trim();
		}

		// Email thread chaining headers (In-Reply-To, References) for Gmail/Apple/Outlook
		const headers: Record<string, string> = { ...(opts.headers || {}) };

		const formatMsgId = (id?: string): string | undefined => {
			if (!id) return undefined;
			const trimmed = id.trim();
			if (!trimmed) return undefined;
			return trimmed.startsWith('<') && trimmed.endsWith('>') ? trimmed : `<${trimmed}>`;
		};

		if (opts.inReplyTo) {
			const formattedInReplyTo = formatMsgId(opts.inReplyTo);
			if (formattedInReplyTo) {
				headers['In-Reply-To'] = formattedInReplyTo;
			}
		}

		if (opts.references) {
			const refList = Array.isArray(opts.references)
				? opts.references
				: opts.references.split(/\s+/);
			const formattedRefs = refList
				.map((r) => formatMsgId(r))
				.filter(Boolean)
				.join(' ');
			if (formattedRefs) {
				headers['References'] = formattedRefs;
			}
		}

		if (Object.keys(headers).length > 0) {
			reqPayload.headers = headers;
		}

		const res = await fetch(`${CIO_API_URL}/send/email`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(reqPayload)
		});

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Customer.io Send API error [${res.status}]: ${errText}`);
		}

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
