/**
 * Test endpoint — sends a test email to the logged-in admin via Customer.io.
 * Renamed from test-sendgrid but kept at the same URL for backwards compat.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email.server';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
		if (sessionError || !session?.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const testEmail = session.user.email!;
		const result = await sendEmail({
			to: testEmail,
			subject: 'Customer.io Test — Abroaducate Email System',
			html: `
				<h2>Customer.io Configuration Test</h2>
				<p>This is a test email to verify your Customer.io integration is working correctly.</p>
				<p>If you received this, transactional emails are live.</p>
			`,
			text: 'Customer.io Configuration Test\n\nThis is a test email. If you received this, transactional emails are live.'
		});

		if (result.success) {
			return json({ success: true, message: 'Test email sent via Customer.io.', testEmail });
		} else {
			return json({ success: false, error: result.error }, { status: 500 });
		}
	} catch (e: any) {
		console.error('Test endpoint error:', e);
		return json({ error: e.message || 'Internal server error' }, { status: 500 });
	}
};
