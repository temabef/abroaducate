import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// --- New, Simplified Architecture ---
// This file has been rewritten to use a dedicated `ai_usage_log` table,
// which is more robust and avoids the issues with the previous RPC-based system.

export interface ComprehensiveUsageCheck {
    allowed: boolean;
    planType: string;
    currentUsage: number;
    limit: number | null;
    message?: string;
}

// A map to define the usage limits for each plan.
// `null` means unlimited.
const AI_FEATURE_LIMITS: Record<string, Record<string, number | null>> = {
	free: {
		reviews: 1,
		text_enhancements: 1,
		word_optimizations: 1,
		grammar_check: 1,
		plagiarism_checks: 1,
		tone_analysis: 1
	},
	professional: {
		reviews: 15,
		text_enhancements: 25,
		word_optimizations: 15,
		grammar_check: 25,
		plagiarism_checks: 10,
		tone_analysis: 25
	},
	elite: {
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null
	}
};

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
 * Checks if a user can use a specific AI feature.
 */
export async function checkComprehensiveUsageLimit(
    userId: string,
	featureSubtype: string
): Promise<ComprehensiveUsageCheck> {
	const supabase = createAdminClient();

    try {
		// 1. Get the user's current subscription plan.
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
			.single();

        const planType = subscription?.plan_type || 'free';

		// 2. Determine the usage limit for the user's plan and the specific feature.
		const limit = AI_FEATURE_LIMITS[planType]?.[featureSubtype] ?? 0;

		// If the limit is null, usage is unlimited.
		if (limit === null) {
			return { allowed: true, planType, currentUsage: Infinity, limit: null };
		}
		
		// 3. Count the user's current usage from the new log table.
		const { count: currentUsage, error: countError } = await supabase
			.from('ai_usage_log')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('feature_type', featureSubtype);

		if (countError) {
			console.error('Error counting AI usage:', countError);
			return { allowed: false, planType, currentUsage: 0, limit, message: 'Could not verify usage.' };
		}

		// 4. Compare current usage to the limit.
		const allowed = (currentUsage || 0) < limit;
        
        return {
            allowed,
            planType,
			currentUsage: currentUsage || 0,
            limit,
			message: allowed ? undefined : `You have reached your monthly limit for ${featureSubtype}.`
		};

	} catch (error) {
		console.error('Error in checkComprehensiveUsageLimit:', error);
		return { allowed: false, planType: 'free', currentUsage: 0, limit: 0, message: 'An error occurred while checking your usage.' };
    }
}

/**
 * Increments the usage for a specific AI feature by adding a log entry.
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
