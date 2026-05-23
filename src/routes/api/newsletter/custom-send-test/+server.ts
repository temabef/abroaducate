/**
 * Send a custom test email to a specific address via Customer.io.
 */
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email.server';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { subject, html, test_email } = await request.json();

		if (!subject || !html || !test_email) {
			return new Response(JSON.stringify({
				success: false,
				error: 'Missing required fields: subject, html, test_email'
			}), { status: 400 });
		}

		const result = await sendEmail({ to: test_email, subject, html });

		if (result.success) {
			return new Response(JSON.stringify({ success: true, message: 'Test email sent successfully' }), { status: 200 });
		} else {
			return new Response(JSON.stringify({ success: false, error: result.error }), { status: 500 });
		}
	} catch (error: any) {
		console.error('Error sending test email:', error);
		return new Response(JSON.stringify({ success: false, error: 'Failed to send test email' }), { status: 500 });
	}
};
