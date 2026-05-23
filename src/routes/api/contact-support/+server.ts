import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { sendEmail } from '$lib/server/email.server';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Simple in-memory rate limiter (per IP, resets on server restart)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; first: number }>();

function getClientIp(request: Request): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
		request.headers.get('x-real-ip') ||
		'unknown'
	);
}

const contactSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	category: z.string().min(1).max(50),
	subject: z.string().max(200).optional().default(''),
	message: z.string().min(10).max(2000),
	priority: z.enum(['low', 'normal', 'high', 'critical']).optional().default('normal')
});

const CATEGORY_LABELS: Record<string, string> = {
	technical: 'Technical Issue',
	billing: 'Billing & Credits',
	account: 'Account Support',
	documents: 'Document Help',
	universities: 'Program Questions',
	general: 'General Inquiry'
};

export const POST: RequestHandler = async ({ request }) => {
	// Rate limiting
	const ip = getClientIp(request);
	const now = Date.now();
	const entry = rateLimitMap.get(ip) ?? { count: 0, first: now };
	if (now - entry.first < RATE_LIMIT_WINDOW_MS) {
		if (entry.count >= RATE_LIMIT_MAX) {
			return json({ error: 'Too many requests. Please try again in an hour.' }, { status: 429 });
		}
		entry.count++;
	} else {
		entry.count = 1;
		entry.first = now;
	}
	rateLimitMap.set(ip, entry);

	try {
		const body = await request.json();
		const parsed = contactSchema.safeParse(body);
		if (!parsed.success) {
			return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
		}

		const { name, email, category, subject, message, priority } = parsed.data;
		const categoryLabel = CATEGORY_LABELS[category] ?? category;
		const requestId = crypto.randomUUID();
		const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'UTC' });

		// Store in DB (non-fatal if table doesn't exist)
		try {
			const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
			await supabase.from('contact_submissions').insert({
				id: requestId,
				name,
				email,
				category,
				subject: subject || `${categoryLabel} inquiry`,
				message,
				priority,
				status: 'open',
				created_at: new Date().toISOString()
			});
		} catch {
			// Non-fatal — table may not exist yet
		}

		// Email to you (support inbox)
		const adminHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#0f172a;margin-bottom:4px;">New Contact Form Submission</h2>
  <p style="color:#64748b;font-size:13px;margin-bottom:24px;">Request ID: ${requestId} · ${timestamp} UTC</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${name}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Category</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${categoryLabel}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Priority</td><td style="padding:8px 0;font-weight:600;color:${priority === 'critical' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#0f172a'};">${priority.toUpperCase()}</td></tr>
    ${subject ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Subject</td><td style="padding:8px 0;color:#0f172a;">${subject}</td></tr>` : ''}
  </table>
  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Message</p>
    <p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap;">${message}</p>
  </div>
  <p style="color:#94a3b8;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
</div>`;

		await sendEmail({
			to: 'hello@abroaducate.com',
			fromEmail: 'hello@abroaducate.com',
			subject: `[${priority.toUpperCase()}] ${categoryLabel} — ${name}`,
			html: adminHtml,
			text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nCategory: ${categoryLabel}\nPriority: ${priority}\n\nMessage:\n${message}\n\nRequest ID: ${requestId}`
		});

		// Auto-reply to the user
		const userHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f1f5f9;">
<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
  <div style="background:#0f172a;padding:24px 32px;text-align:center;">
    <p style="color:#fff;font-size:20px;font-weight:800;margin:0;">Abroaducate</p>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Support</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#0f172a;font-size:20px;font-weight:800;margin:0 0 8px;">We got your message</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${name}, thanks for reaching out. We'll get back to you within 24–48 hours.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Your request</p>
      <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>Category:</strong> ${categoryLabel}</p>
      <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>Priority:</strong> ${priority}</p>
      <p style="color:#64748b;font-size:12px;margin:8px 0 0;">Reference: ${requestId}</p>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0;">If your issue is urgent, reply to this email directly.</p>
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <a href="https://abroaducate.com" style="color:#64748b;font-size:12px;text-decoration:none;">abroaducate.com</a>
  </div>
</div></div>`;

		await sendEmail({
			to: email,
			subject: `We received your message — ${categoryLabel}`,
			html: userHtml,
			text: `Hi ${name},\n\nThanks for reaching out. We'll get back to you within 24–48 hours.\n\nCategory: ${categoryLabel}\nPriority: ${priority}\nReference: ${requestId}\n\nIf urgent, reply to this email.\n\nAbroaducate`
		});

		return json({ success: true, requestId });

	} catch (err: any) {
		console.error('[contact-support] Error:', err);
		return json({ error: 'Failed to send message. Please email hello@abroaducate.com directly.' }, { status: 500 });
	}
};
