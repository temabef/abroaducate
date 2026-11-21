import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// USAGE LIMITS
// Abroaducate is 100% free. To keep AI costs predictable, every signed-in user gets
// DAILY_AI_LIMIT AI actions per rolling 24 hours, shared across all AI tools
// (document generation, reviews, edits, visa practice, win strategies...).
// Each use is logged to ai_usage_log; the limit counts those rows.

export const DAILY_AI_LIMIT = 20;

export interface ComprehensiveUsageCheck {
	allowed: boolean;
	planType: string;
	currentUsage: number;
	limit: number | null;
	message?: string;
}

/**
 * Creates a temporary, privileged Supabase client for secure server-side operations.
 */
function createAdminClient(): SupabaseClient {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

/**
 * Checks whether a user still has AI actions left today (rolling 24h, all features combined).
 * Fails open if the log can't be read, so a database hiccup never blocks students.
 */
export async function checkComprehensiveUsageLimit(
	userId: string,
	_featureSubtype: string
): Promise<ComprehensiveUsageCheck> {
	const supabase = createAdminClient();
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

	const { count, error } = await supabase
		.from('ai_usage_log')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.gte('created_at', since);

	if (error) {
		console.error('Error reading AI usage:', error);
		return { allowed: true, planType: 'free', currentUsage: 0, limit: DAILY_AI_LIMIT };
	}

	const used = count ?? 0;
	const allowed = used < DAILY_AI_LIMIT;
	return {
		allowed,
		planType: 'free',
		currentUsage: used,
		limit: DAILY_AI_LIMIT,
		message: allowed
			? undefined
			: `You've used all ${DAILY_AI_LIMIT} free AI actions for today. Your limit resets within 24 hours. Everything else on Abroaducate stays free.`
	};
}

/**
 * Check + log in one call, for endpoints that make exactly one AI call per request.
 * Returns a 429 JSON body to send back when the user is over the limit, or null to proceed.
 */
export async function enforceDailyAiLimit(userId: string, featureSubtype: string) {
	const check = await checkComprehensiveUsageLimit(userId, featureSubtype);
	if (!check.allowed) {
		return {
			error: 'Daily limit reached',
			message: check.message,
			planType: check.planType,
			currentUsage: check.currentUsage,
			limit: check.limit,
			upgradeRequired: true
		};
	}
	await incrementComprehensiveUsage(userId, featureSubtype);
	return null;
}

/**
 * Increments the usage for a specific AI feature by adding an audit log entry.
 */
export async function incrementComprehensiveUsage(
    userId: string,
	featureSubtype: string
): Promise<boolean> {
	const supabase = createAdminClient();

	try {
		const { error } = await supabase
			.from('ai_usage_log')
			.insert({
				user_id: userId,
				feature_type: featureSubtype
			});

		if (error) {
			console.error('Error incrementing AI usage:', error);
			return false;
		}

		return true;
        
    } catch (error) {
		console.error('Exception in incrementComprehensiveUsage:', error);
        return false;
    }
}

/**
 * Wrapper function that matches the interface expected by API endpoints
 * This checks usage and increments it in one atomic operation
 */
export async function checkUsageLimit(
    supabase: any,
    userId: string,
    usageType: string
): Promise<ComprehensiveUsageCheck> {
    const usageCheck = await checkComprehensiveUsageLimit(userId, usageType);
    if (usageCheck.allowed && usageCheck.limit !== null) {
        await incrementComprehensiveUsage(userId, usageType);
    }
    return usageCheck;
}
