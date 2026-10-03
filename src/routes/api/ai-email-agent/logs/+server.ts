import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { getEmailAgentSettings } from '$lib/server/ai-email-agent/service';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Verify admin session
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 100);
	const status = url.searchParams.get('status');
	const category = url.searchParams.get('category');

	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return json({ logs: [], settings: await getEmailAgentSettings() });
	}

	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		let query = supabase
			.from('ai_email_logs')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (status && status !== 'all') {
			query = query.eq('status', status);
		}
		if (category && category !== 'all') {
			query = query.eq('category', category);
		}

		const { data: logs, error } = await query;
		if (error) {
			console.warn('[AI_EMAIL_LOGS] Query error:', error);
			return json({ logs: [], settings: await getEmailAgentSettings() });
		}

		// Also get summary stats
		const { count: totalCount } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true });

		const { count: repliedCount } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'replied');

		const { count: escalatedCount } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true })
			.eq('escalated', true);

		const settings = await getEmailAgentSettings();

		return json({
			logs: logs || [],
			stats: {
				total: totalCount || (logs?.length ?? 0),
				replied: repliedCount || 0,
				escalated: escalatedCount || 0
			},
			settings
		});
	} catch (err: any) {
		console.error('[AI_EMAIL_LOGS] Error:', err);
		return json({ logs: [], settings: await getEmailAgentSettings() });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Update settings
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { agentEnabled, autonomousMode, escalationEmail, dailyReplyLimitPerUser, modelName } = body;

		if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
			return json({ error: 'Database service key missing' }, { status: 500 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		const updates = [
			{ key: 'agent_enabled', value: agentEnabled },
			{ key: 'autonomous_mode', value: autonomousMode },
			{ key: 'escalation_email', value: escalationEmail },
			{ key: 'daily_reply_limit_per_user', value: dailyReplyLimitPerUser },
			{ key: 'model_name', value: modelName }
		];

		for (const item of updates) {
			if (item.value !== undefined) {
				await supabase.from('ai_email_settings').upsert({
					key: item.key,
					value: item.value,
					updated_at: new Date().toISOString()
				});
			}
		}

		const newSettings = await getEmailAgentSettings();
		return json({ success: true, settings: newSettings });
	} catch (err: any) {
		return json({ error: err?.message || 'Failed to update settings' }, { status: 500 });
	}
};
