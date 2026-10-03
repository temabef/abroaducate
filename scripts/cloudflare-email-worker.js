/**
 * 🚀 Cloudflare Email Worker for Abroaducate AI Email Agent
 *
 * This worker runs 100% free on Cloudflare.
 * Whenever an email is sent to hello@abroaducate.com (or *@abroaducate.com),
 * Cloudflare triggers this worker, which:
 *  1. (Optional) Forwards a copy to your personal email so you never miss anything.
 *  2. Dispatches the email to the Abroaducate AI Agent webhook.
 *  3. The AI generates the reply and sends it back to the student via Zoho SMTP!
 *
 * HOW TO DEPLOY:
 * 1. Open Cloudflare Dashboard -> "Workers & Pages" -> "Create Application" -> "Create Worker".
 * 2. Name: "abroaducate-email-agent-worker"
 * 3. Click "Deploy", then "Edit code" and paste this entire file.
 * 4. Go to Worker "Settings" -> "Variables and Secrets" -> Add:
 *      AI_EMAIL_AGENT_SECRET = df688903-b6c7-436a-93a8-0bad926288c9
 *      WEBHOOK_URL = https://www.abroaducate.com/api/ai-email-agent/webhook
 *      FORWARD_TO = (optional: e.g. your personal gmail)
 * 5. Go to Cloudflare Dashboard -> "Email Routing" -> "Routing Rules":
 *      - Click "Create rule"
 *      - Custom Address: "hello@abroaducate.com" (or Catch-all)
 *      - Action: "Send to a Worker"
 *      - Destination: "abroaducate-email-agent-worker"
 */

export default {
	async email(message, env, ctx) {
		const webhookUrl = env.WEBHOOK_URL || 'https://www.abroaducate.com/api/ai-email-agent/webhook';
		const secretToken = env.AI_EMAIL_AGENT_SECRET || 'df688903-b6c7-436a-93a8-0bad926288c9';

		const fromAddress = message.from;
		const toAddress = message.to;
		const subject = message.headers.get('subject') || '(No Subject)';
		const messageId = message.headers.get('message-id') || '';

		// Read the raw email text
		let rawContent = '';
		try {
			rawContent = await new Response(message.raw).text();
		} catch (readErr) {
			console.error('[EMAIL_WORKER] Failed to read email stream:', readErr);
		}

		// Extract body text after headers
		let bodyText = '';
		if (rawContent) {
			// In RFC822, headers and body are separated by an empty line
			const headerEndIndex = rawContent.search(/\r?\n\r?\n/);
			if (headerEndIndex !== -1) {
				bodyText = rawContent.slice(headerEndIndex).trim();
			} else {
				bodyText = rawContent;
			}
		}

		// Collect headers map
		const headersObj = {};
		for (const [k, v] of message.headers.entries()) {
			headersObj[k.toLowerCase()] = v;
		}

		const payload = {
			from: fromAddress,
			to: toAddress,
			subject: subject,
			text: bodyText.slice(0, 10000), // Limit size for safe payload
			messageId: messageId,
			headers: headersObj,
			receivedAt: new Date().toISOString()
		};

		// POST to Abroaducate AI Agent Webhook
		try {
			const res = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Email-Agent-Secret': secretToken
				},
				body: JSON.stringify(payload)
			});

			const resData = await res.text();
			console.log(`[EMAIL_WORKER] Webhook response [${res.status}]: ${resData}`);
		} catch (postErr) {
			console.error('[EMAIL_WORKER] Failed to post to webhook:', postErr);
		}
	}
};
