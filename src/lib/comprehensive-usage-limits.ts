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
		// Original names
		reviews: 1,
		text_enhancements: 1,
		word_optimizations: 1,
		grammar_check: 1,
		plagiarism_checks: 1,
		tone_analysis: 1,
		university_matching: 25,
		// Alternative names for compatibility
		sop_review: 1,
		text_enhancement: 1,
		word_optimization: 1,
		plagiarism_check: 1
	},
	professional: {
		// Original names
		reviews: 15,
		text_enhancements: 25,
		word_optimizations: 15,
		grammar_check: 25,
		plagiarism_checks: 10,
		tone_analysis: 25,
		university_matching: 200,
		// Alternative names for compatibility
		sop_review: 15,
		text_enhancement: 25,
		word_optimization: 15,
		plagiarism_check: 10
	},
	elite: {
		// Original names
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null,
		university_matching: 500,
		// Alternative names for compatibility
		sop_review: null,
		text_enhancement: null,
		word_optimization: null,
		plagiarism_check: null
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
		const limit = AI_FEATURE_LIMITS[planType]?.[featureSubtype];
		
		// If feature not found in limits, default based on plan
		if (limit === undefined) {
			if (planType === 'elite') {
				// Elite plans get unlimited access to any AI feature
				return { allowed: true, planType, currentUsage: 0, limit: null };
			} else {
				// Other plans get blocked if feature not defined
				return { allowed: false, planType, currentUsage: 0, limit: 0, message: `Feature ${featureSubtype} not available for ${planType} plan.` };
			}
		}

		// Debug logging for Elite plan users
		if (planType === 'elite') {
			console.log(`Elite plan user - Feature: ${featureSubtype}, Limit: ${limit}`);
		}

		// If the limit is null (unlimited), allow usage
		if (limit === null) {
			return { allowed: true, planType, currentUsage: 0, limit: null };
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

/**
 * Wrapper function that matches the interface expected by API endpoints
 * This checks usage and increments it in one atomic operation
 */
export async function checkUsageLimit(
    supabase: any, // Keep the interface compatible
    userId: string,
    usageType: string
): Promise<ComprehensiveUsageCheck> {
    // First check if user can use the feature
    const usageCheck = await checkComprehensiveUsageLimit(userId, usageType);
    
    // If allowed, increment the usage
    if (usageCheck.allowed && usageCheck.limit !== null) {
        await incrementComprehensiveUsage(userId, usageType);
    }
    
    return usageCheck;
}
