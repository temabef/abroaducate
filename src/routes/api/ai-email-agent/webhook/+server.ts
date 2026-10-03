import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processIncomingEmail } from '$lib/server/ai-email-agent/service';
import { parseSenderAddress } from '$lib/server/ai-email-agent/guards';
import type { IncomingEmail } from '$lib/server/ai-email-agent/types';
import { env } from '$env/dynamic/private';

/**
 * Validates the webhook request authorization.
 */
function isAuthorized(request: Request, url: URL): boolean {
	const secretToken =
		env.AI_EMAIL_AGENT_SECRET ||
		(process.env as any)?.AI_EMAIL_AGENT_SECRET ||
		env.CRON_SECRET ||
		(process.env as any)?.CRON_SECRET;

	// If no secret is configured, we allow requests in development, but warn
	if (!secretToken) {
		console.warn('[AI_EMAIL_AGENT_WEBHOOK] ⚠️ Warning: No AI_EMAIL_AGENT_SECRET configured');
		return true;
	}

	const authHeader = request.headers.get('authorization') || '';
	const tokenHeader = request.headers.get('x-email-agent-secret') || '';
	const tokenQuery = url.searchParams.get('token') || '';

	if (tokenHeader === secretToken || tokenQuery === secretToken) {
		return true;
	}

	if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === secretToken) {
		return true;
	}

	return false;
}

/**
 * Normalizes different incoming webhook formats (Cloudflare, Resend, SendGrid, Postmark, custom)
 * into a single unified IncomingEmail object.
 */
async function parseIncomingPayload(request: Request): Promise<IncomingEmail | null> {
	const contentType = request.headers.get('content-type') || '';

	let body: any = {};
	if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
		const formData = await request.formData();
		const entries = Object.fromEntries(formData.entries());
		body = entries;
	} else {
		body = await request.json().catch(() => ({}));
	}

	// 1. Resend Inbound Format: { type: 'email.received', data: { from, to, subject, text, html } }
	if (body?.type === 'email.received' && body?.data) {
		const data = body.data;
		const parsedSender = parseSenderAddress(data.from || '');
		return {
			from: data.from || '',
			fromEmail: parsedSender.email,
			fromName: parsedSender.name,
			to: Array.isArray(data.to) ? data.to[0] : (data.to || 'hello@abroaducate.com'),
			subject: data.subject || '(No Subject)',
			text: data.text || '',
			html: data.html || undefined,
			messageId: data.email_id || data.message_id
		};
	}

	// 2. Postmark Inbound Format: { From, To, Subject, TextBody, HtmlBody, MessageID }
	if (body?.From && (body?.TextBody !== undefined || body?.HtmlBody !== undefined)) {
		const parsedSender = parseSenderAddress(body.From);
		return {
			from: body.From,
			fromEmail: parsedSender.email,
			fromName: parsedSender.name,
			to: body.To || 'hello@abroaducate.com',
			subject: body.Subject || '(No Subject)',
			text: body.TextBody || '',
			html: body.HtmlBody || undefined,
			messageId: body.MessageID
		};
	}

	// 3. SendGrid Inbound Parse Format: { from, to, subject, text, html, headers }
	// Or standard JSON payload (Cloudflare Worker forwarding)
	const rawFrom = body.from || body.From || body.sender || '';
	if (rawFrom) {
		const parsedSender = parseSenderAddress(rawFrom);
		let headersMap: Record<string, string> | undefined;

		if (typeof body.headers === 'string') {
			try {
				headersMap = JSON.parse(body.headers);
			} catch {
				// string headers
			}
		} else if (typeof body.headers === 'object') {
			headersMap = body.headers;
		}

		const resolvedMessageId =
			body.messageId ||
			body['Message-Id'] ||
			body['message-id'] ||
			body.MessageID ||
			headersMap?.['message-id'] ||
			headersMap?.['Message-Id'] ||
			headersMap?.['Message-ID'] ||
			undefined;

		return {
			from: rawFrom,
			fromEmail: parsedSender.email,
			fromName: body.fromName || parsedSender.name,
			to: body.to || body.To || body.recipient || 'hello@abroaducate.com',
			subject: body.subject || body.Subject || '(No Subject)',
			text: body.text || body.Text || body.body || body.message || '',
			html: body.html || body.Html || undefined,
			messageId: resolvedMessageId,
			headers: headersMap
		};
	}

	return null;
}

export const POST: RequestHandler = async ({ request, url }) => {
	if (!isAuthorized(request, url)) {
		return json({ error: 'Unauthorized: Invalid or missing webhook secret' }, { status: 401 });
	}

	try {
		const email = await parseIncomingPayload(request);
		if (!email || !email.fromEmail) {
			return json(
				{ error: 'Invalid email payload: missing sender email address' },
				{ status: 400 }
			);
		}

		console.log(`[AI_EMAIL_AGENT_WEBHOOK] 📩 Received email from ${email.fromEmail} - "${email.subject}"`);

		// Process the incoming email through the autonomous AI agent pipeline
		const result = await processIncomingEmail(email);

		return json({
			success: result.success,
			status: result.status,
			classification: result.classification,
			escalated: result.escalated,
			processingMs: result.processingMs
		});
	} catch (err: any) {
		console.error('[AI_EMAIL_AGENT_WEBHOOK] Internal error:', err);
		return json({ error: 'Internal server error processing incoming email', details: err?.message }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	return json({
		service: 'Abroaducate AI Email Agent Webhook',
		status: 'operational',
		endpoints: {
			POST: 'Accepts inbound email webhooks from Cloudflare Email Workers, Resend, SendGrid, Postmark'
		}
	});
};
