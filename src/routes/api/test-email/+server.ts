/**
 * Test email endpoint — sends a test email to the logged-in user via Customer.io.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email.server';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { data: { session } } = await locals.supabase.auth.getSession();
		if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

		const body = await request.json().catch(() => ({}));
		const targetEmail = body.email || session.user.email;
		const subject = body.subject || 'Test Email — Abroaducate';
		const html = body.html || '<h2>Test Email</h2><p>This is a test email from Abroaducate.</p>';

		const result = await sendEmail({ to: targetEmail, subject, html });

		if (result.success) {
			return json({ success: true, message: `Test email sent to ${targetEmail}` });
		} else {
			return json({ success: false, error: result.error }, { status: 500 });
		}
	} catch (e: any) {
		return json({ error: e.message || 'Internal server error' }, { status: 500 });
	}
};
