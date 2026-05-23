/**
 * Email reminders API — sends deadline reminder emails via Customer.io.
 * Replaced SendGrid with the shared email.server helper.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email.server';

interface EmailReminderRequest {
	type: 'deadline' | 'milestone' | 'document';
	recipients: string[];
	scholarshipData: {
		title: string;
		provider: string;
		deadline: string;
		daysUntil: number;
		urgency: 'critical' | 'urgent' | 'important' | 'moderate';
	};
	userPreferences?: {
		emailEnabled: boolean;
		frequency: 'immediate' | 'daily' | 'weekly';
	};
}

const URGENCY_COLORS = {
	critical: '#DC2626',
	urgent: '#EA580C',
	important: '#D97706',
	moderate: '#2563EB'
};

const URGENCY_LABELS = {
	critical: 'URGENT',
	urgent: 'IMPORTANT',
	important: 'NOTICE',
	moderate: 'REMINDER'
};

function generateEmailTemplate(data: EmailReminderRequest['scholarshipData']) {
	const { title, provider, deadline, daysUntil, urgency } = data;
	const color = URGENCY_COLORS[urgency];
	const label = URGENCY_LABELS[urgency];
	const timeText = daysUntil === 0 ? 'TODAY' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
	const subject = `${label}: ${title} deadline ${timeText}`;

	const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;border-bottom:2px solid #f0f0f0;padding-bottom:20px;margin-bottom:30px;">
    <h1 style="color:#1E40AF;margin:0;font-size:28px;">Abroaducate</h1>
    <p style="color:#666;margin:5px 0 0 0;">Scholarship Application Tracker</p>
  </div>
  <div style="background-color:${color}15;border-left:4px solid ${color};padding:15px;margin-bottom:25px;border-radius:4px;">
    <h2 style="color:${color};margin:0 0 5px 0;font-size:18px;">${label}: Deadline Approaching</h2>
    <p style="margin:0;color:#555;">Your scholarship application deadline is ${timeText}</p>
  </div>
  <div style="background-color:#f8fafc;padding:20px;border-radius:8px;margin-bottom:25px;">
    <h3 style="color:#1f2937;margin:0 0 15px 0;">Scholarship Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#666;font-weight:600;width:30%;">Scholarship:</td><td style="padding:8px 0;color:#1f2937;font-weight:600;">${title}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-weight:600;">Provider:</td><td style="padding:8px 0;color:#1f2937;">${provider}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-weight:600;">Deadline:</td><td style="padding:8px 0;color:${color};font-weight:600;">${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-weight:600;">Time Remaining:</td><td style="padding:8px 0;color:${color};font-weight:600;">${daysUntil === 0 ? 'DUE TODAY!' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} left`}</td></tr>
    </table>
  </div>
  <div style="text-align:center;margin:30px 0;">
    <a href="https://abroaducate.com/dashboard" style="display:inline-block;background-color:#2563EB;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;margin:0 10px 10px 0;">View Dashboard</a>
    <a href="https://abroaducate.com/scholarships" style="display:inline-block;background-color:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Browse Scholarships</a>
  </div>
  <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:30px;text-align:center;color:#6b7280;font-size:14px;">
    <p>This reminder was sent from your <strong>Abroaducate</strong> scholarship tracker.</p>
    <p><a href="https://abroaducate.com/settings" style="color:#2563EB;text-decoration:none;">Manage email preferences</a></p>
  </div>
</body>
</html>`;

	const text = `ABROADUCATE — Scholarship Deadline Reminder\n\n${label}: ${title}\nDeadline: ${timeText}\n\nProvider: ${provider}\nDeadline date: ${new Date(deadline).toLocaleDateString()}\n\nVisit your dashboard: https://abroaducate.com/dashboard`;

	return { subject, html, text };
}

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const { type, recipients, scholarshipData, userPreferences }: EmailReminderRequest = await request.json();

		if (userPreferences && !userPreferences.emailEnabled) {
			return json({ success: true, message: 'Email notifications disabled for user', sent: 0 });
		}

		const { subject, html, text } = generateEmailTemplate(scholarshipData);

		let sent = 0;
		let failed = 0;
		for (const email of recipients) {
			const result = await sendEmail({ to: email, subject, html, text });
			if (result.success) sent++;
			else failed++;
		}

		await supabase.from('email_logs').insert({
			user_id: session.user.id,
			email_type: type,
			recipients,
			subject,
			status: failed === 0 ? 'sent' : 'partial_failure',
			success_count: sent,
			failure_count: failed,
			scholarship_data: scholarshipData,
			sent_at: new Date().toISOString()
		});

		return json({ success: true, message: `Successfully sent ${sent} email(s)`, sent, failed });

	} catch (error: any) {
		console.error('Error in email reminders API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const userId = session.user.id;

		const { data: preferences } = await supabase
			.from('user_preferences')
			.select('email_enabled, email_deadlines, email_frequency')
			.eq('user_id', userId)
			.single();

		const { data: scholarships, error: scholarshipsError } = await supabase
			.from('user_scholarship_interactions')
			.select('scholarship_id, scholarships!inner(title, provider, deadline, amount, location)')
			.eq('user_id', userId)
			.filter('scholarships.deadline', 'gte', new Date().toISOString())
			.order('scholarships.deadline', { ascending: true });

		if (scholarshipsError) return json({ error: 'Failed to fetch scholarship data' }, { status: 500 });

		const upcomingReminders = (scholarships ?? []).map((item: any) => {
			const s = item.scholarships;
			const daysUntil = Math.ceil((new Date(s.deadline).getTime() - Date.now()) / 86400000);
			const urgency = daysUntil <= 1 ? 'critical' : daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'important' : 'moderate';
			return { scholarship_id: item.scholarship_id, title: s.title, provider: s.provider, deadline: s.deadline, daysUntil, urgency, needsReminder: daysUntil <= 7 && daysUntil >= 0 };
		}).filter((i: any) => i.needsReminder);

		return json({
			success: true,
			preferences: preferences ?? { email_enabled: true, email_deadlines: true, email_frequency: 'daily' },
			upcomingReminders,
			totalUpcoming: upcomingReminders.length
		});

	} catch (error: any) {
		console.error('Error in email reminders GET:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
