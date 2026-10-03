/**
 * 🚀 Cloudflare Email Worker for Abroaducate AI Email Agent
 *
 * This worker runs 100% free on Cloudflare.
 * Whenever an email is sent to hello@abroaducate.com,
 * Cloudflare triggers this worker, which:
 *  1. Forwards a copy to abroaducate@gmail.com so you always have the email in Gmail.
 *  2. Posts the payload to the Abroaducate AI Agent webhook.
 *  3. The AI agent responds to the student autonomously in clean, human-like text.
 */

export default {
	async email(message, env, ctx) {
		const task = (async () => {
			const webhookUrl = env.WEBHOOK_URL || 'https://www.abroaducate.com/api/ai-email-agent/webhook';
			const secretToken = env.AI_EMAIL_AGENT_SECRET || 'df688903-b6c7-436a-93a8-0bad926288c9';
			const forwardAddress = env.FORWARD_TO || 'abroaducate@gmail.com';

			// 1. Forward a copy of the incoming email to abroaducate@gmail.com
			if (forwardAddress && message.from.toLowerCase() !== forwardAddress.toLowerCase()) {
				try {
					await message.forward(forwardAddress);
					console.log(`[EMAIL_WORKER] ✅ Forwarded copy to ${forwardAddress}`);
				} catch (fwdErr) {
					console.warn(`[EMAIL_WORKER] Forwarding copy to ${forwardAddress} skipped/failed:`, fwdErr);
				}
			}

			const fromAddress = message.headers.get('from') || message.from;
			const toAddress = message.to;
			const subject = message.headers.get('subject') || '(No Subject)';
			const messageId = message.headers.get('message-id') || '';

			// Read raw email text
			let rawContent = '';
			try {
				rawContent = await new Response(message.raw).text();
			} catch (readErr) {
				console.error('[EMAIL_WORKER] Failed to read email stream:', readErr);
			}

			// Extract body text after headers
			let bodyText = '';
			if (rawContent) {
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
				text: bodyText.slice(0, 10000),
				messageId: messageId,
				headers: headersObj,
				receivedAt: new Date().toISOString()
			};

			try {
				console.log(`[EMAIL_WORKER] Forwarding to webhook: ${fromAddress} - "${subject}"`);
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
		})();

		ctx.waitUntil(task);
	}
};
