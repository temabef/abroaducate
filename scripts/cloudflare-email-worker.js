/**
 * 🚀 Cloudflare Email Worker for Abroaducate AI Email Agent
 *
 * This worker triggers the autonomous AI email responder.
 * Native Cloudflare forwarding handles delivery to abroaducate@gmail.com,
 * while this worker dispatches the email to the Abroaducate AI webhook.
 */

export default {
	async email(message, env, ctx) {
		ctx.waitUntil((async () => {
			const webhookUrl = env.WEBHOOK_URL || 'https://www.abroaducate.com/api/ai-email-agent/webhook';
			const secretToken = env.AI_EMAIL_AGENT_SECRET || 'df688903-b6c7-436a-93a8-0bad926288c9';

			const fromAddress = message.headers.get('from') || message.from;
			const toAddress = message.to;
			const subject = message.headers.get('subject') || '(No Subject)';
			const messageId = message.headers.get('message-id') || '';

			let bodyText = '';
			try {
				const rawContent = await new Response(message.raw).text();
				const headerEndIndex = rawContent.search(/\r?\n\r?\n/);
				bodyText = (headerEndIndex !== -1 ? rawContent.slice(headerEndIndex) : rawContent).trim();
			} catch (err) {
				console.error('[EMAIL_WORKER] Could not parse raw stream:', err);
			}

			const headersObj = {};
			try {
				for (const [k, v] of message.headers.entries()) {
					headersObj[k.toLowerCase()] = v;
				}
			} catch (e) {}

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
				console.log(`[EMAIL_WORKER] Calling AI agent for: ${fromAddress} - "${subject}"`);
				const res = await fetch(webhookUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Email-Agent-Secret': secretToken
					},
					body: JSON.stringify(payload)
				});
				const responseText = await res.text();
				console.log(`[EMAIL_WORKER] Webhook result [${res.status}]: ${responseText}`);
			} catch (err) {
				console.error('[EMAIL_WORKER] Webhook dispatch error:', err);
			}
		})());
	}
};
