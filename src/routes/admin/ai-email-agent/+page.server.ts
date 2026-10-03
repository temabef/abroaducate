import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { getEmailAgentSettings } from '$lib/server/ai-email-agent/service';

export const load: PageServerLoad = async () => {
	const settings = await getEmailAgentSettings();

	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return {
			settings,
			logs: [],
			stats: { total: 0, replied: 0, skipped: 0, escalated: 0 }
		};
	}

	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Fetch recent 20 logs
		const { data: logs } = await supabase
			.from('ai_email_logs')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(20);

		// Fetch counts
		const { count: total } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true });

		const { count: replied } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'replied');

		const { count: skipped } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true })
			.in('status', ['skipped_loop', 'skipped_spam']);

		const { count: escalated } = await supabase
			.from('ai_email_logs')
			.select('*', { count: 'exact', head: true })
			.eq('escalated', true);

		return {
			settings,
			logs: logs || [],
			stats: {
				total: total || 0,
				replied: replied || 0,
				skipped: skipped || 0,
				escalated: escalated || 0
			}
		};
	} catch (err) {
		console.warn('[AI_EMAIL_AGENT_PAGE] Error fetching logs:', err);
		return {
			settings,
			logs: [],
			stats: { total: 0, replied: 0, skipped: 0, escalated: 0 }
		};
	}
};
