import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processIncomingEmail } from '$lib/server/ai-email-agent/service';
import { parseSenderAddress } from '$lib/server/ai-email-agent/guards';
import type { IncomingEmail } from '$lib/server/ai-email-agent/types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Verify admin access
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { from = 'student@example.com', subject = 'Scholarship question', text = '', forceSend = false } = body;

		if (!text.trim()) {
			return json({ error: 'Email content is required' }, { status: 400 });
		}

		const parsedSender = parseSenderAddress(from);
		const email: IncomingEmail = {
			from,
			fromEmail: parsedSender.email,
			fromName: parsedSender.name,
			to: 'hello@abroaducate.com',
			subject,
			text,
			receivedAt: new Date().toISOString()
		};

		// Run through pipeline in simulation mode (or forceSend if requested by admin)
		const result = await processIncomingEmail(email, {
			isSimulation: !forceSend,
			forceAutonomous: forceSend
		});

		return json({
			success: result.success,
			status: result.status,
			email,
			classification: result.classification,
			studentProfile: result.studentProfile,
			replySubject: result.replySubject,
			replyText: result.replyText,
			replyHtml: result.replyHtml,
			escalated: result.escalated,
			processingMs: result.processingMs,
			isDryRun: !forceSend
		});
	} catch (err: any) {
		console.error('[AI_EMAIL_SIMULATE] Error:', err);
		return json({ error: err?.message || 'Simulation failed' }, { status: 500 });
	}
};
