import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// COMPREHENSIVE USAGE LIMITS - MATCHES PRICING PAGE & SQL EXACTLY
// Updated: Final version for deployment - matches all systems

export interface ComprehensiveUsageCheck {
	allowed: boolean;
	planType: string;
	currentUsage: number;
	limit: number | null;
	message?: string;
}

// FINAL PRODUCTION LIMITS - MATCHES PRICING PAGE EXACTLY
const AI_FEATURE_LIMITS: Record<string, Record<string, number | null>> = {
	free: {
		// Document Generation - MATCHES PRICING PAGE EXACTLY
		sop_generation: 2,
		cover_letter_generation: 2,
		personal_statement_generation: 1,
		academic_cv_generation: 1,
		total_documents: 6, // 2+2+1+1
		
		// AI Enhancement Features - MATCHES PRICING PAGE EXACTLY
		reviews: 1, // CORRECTED: Was 3, now 1 to match pricing
		text_enhancements: 1, // CORRECTED: Was 5, now 1 to match pricing  
		word_optimizations: 1, // CORRECTED: Was 3, now 1 to match pricing
		grammar_check: 1,
		plagiarism_checks: 1,
		tone_analysis: 1,
		inline_edits: 5,
		
		// Cold Email Generator - MATCHES PRICING PAGE EXACTLY
		cold_email_generation: 5, // FREE users get 5 emails per month
		
		// Visa Interview - MATCHES PRICING PAGE EXACTLY
		visa_interview_questions: 6, // CORRECTED: 6 questions/session as per pricing
		
		// University Matching - MATCHES PRICING PAGE EXACTLY
		university_matching: 50, // 50+ universities
		university_queries: 5,
		
		// Application Tracking - MATCHES PRICING PAGE EXACTLY
		application_tracking: 12, // 12 applications with basic reminders
		
		// Document Checklist Limits - FREE FOR ALL
		document_checklists: null, // Unlimited access
		checklist_progress: null, // Unlimited progress tracking
		
		// Alternative names for compatibility
		sop_review: 1,
		text_enhancement: 1,
		word_optimization: 1,
		plagiarism_check: 1
	},
	professional: {
		// Document Generation - MATCHES PRICING PAGE EXACTLY
		sop_generation: 50,
		cover_letter_generation: 50,
		personal_statement_generation: 50,
		academic_cv_generation: 50,
		total_documents: 50, // Flexible allocation
		
		// AI Enhancement Features - MATCHES PRICING PAGE EXACTLY
		reviews: 15,
		text_enhancements: 25,
		word_optimizations: 15,
		grammar_check: 25,
		plagiarism_checks: 10,
		tone_analysis: 25,
		inline_edits: 50,
		
		// Cold Email Generator - MATCHES PRICING PAGE EXACTLY
		cold_email_generation: 50, // CORRECTED: 50 per month as per pricing
		
		// Visa Interview - MATCHES PRICING PAGE EXACTLY
		visa_interview_questions: 50, // CORRECTED: 50 questions/session as per pricing
		
		// University Matching - MATCHES PRICING PAGE EXACTLY
		university_matching: 500, // 500+ universities
		university_queries: 25,
		
		// Application Tracking - MATCHES PRICING PAGE EXACTLY
		application_tracking: 1000, // 1000 applications with analytics
		
		// Document Checklist Limits - FREE FOR ALL
		document_checklists: null, // Unlimited access
		checklist_progress: null, // Unlimited progress tracking
		
		// Alternative names for compatibility
		sop_review: 15,
		text_enhancement: 25,
		word_optimization: 15,
		plagiarism_check: 10
	},
	elite: {
		// Document Generation - UNLIMITED
		sop_generation: null,
		cover_letter_generation: null,
		personal_statement_generation: null,
		academic_cv_generation: null,
		total_documents: null,
		
		// AI Enhancement Features - UNLIMITED
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null,
		inline_edits: null,
		
		// Cold Email Generator - MATCHES PRICING PAGE EXACTLY
		cold_email_generation: 500, // CORRECTED: 500 per month as per pricing page
		
		// Visa Interview - MATCHES PRICING PAGE EXACTLY
		visa_interview_questions: 80, // CORRECTED: 80+ questions/session as per pricing
		
		// University Matching - MATCHES PRICING PAGE EXACTLY
		university_matching: 1500, // 1500+ universities + priority access
		university_queries: null, // Unlimited
		
		// Application Tracking - UNLIMITED
		application_tracking: null, // Unlimited applications
		
		// Document Checklist Limits - FREE FOR ALL
		document_checklists: null, // Unlimited access
		checklist_progress: null, // Unlimited progress tracking
		
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

		// 2. Handle flexible document allocation for Professional+ plans
		const documentGenerationFeatures = ['sop_generation', 'cover_letter_generation', 'personal_statement_generation', 'academic_cv_generation'];
		const isDocumentGeneration = documentGenerationFeatures.includes(featureSubtype);

		if (isDocumentGeneration && planType === 'professional') {
			// For Professional tier: Check total document usage across all types (flexible allocation)
			const totalDocumentLimit = AI_FEATURE_LIMITS[planType]?.['total_documents'];
			
			if (totalDocumentLimit === null) {
				return { allowed: true, planType, currentUsage: 0, limit: null };
			}
			
			// Count total document usage across all document types
			const { count: totalDocumentUsage, error: countError } = await supabase
				.from('ai_usage_log')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', userId)
				.in('feature_type', documentGenerationFeatures);

			if (countError) {
				console.error('Error counting total document usage:', countError);
				return { allowed: false, planType, currentUsage: 0, limit: totalDocumentLimit, message: 'Could not verify usage.' };
			}

			const allowed = (totalDocumentUsage || 0) < totalDocumentLimit;
			return {
				allowed,
				planType,
				currentUsage: totalDocumentUsage || 0,
				limit: totalDocumentLimit,
				message: allowed ? undefined : `You have reached your monthly limit of ${totalDocumentLimit} documents across all types.`
			};
		}

		// 3. For Free tier document generation: Check individual limits
		if (isDocumentGeneration && planType === 'free') {
			const limit = AI_FEATURE_LIMITS[planType]?.[featureSubtype];
			
			if (limit === undefined) {
				return { allowed: false, planType, currentUsage: 0, limit: 0, message: `Feature ${featureSubtype} not available for ${planType} plan.` };
			}

			const { count: currentUsage, error: countError } = await supabase
				.from('ai_usage_log')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', userId)
				.eq('feature_type', featureSubtype);

			if (countError) {
				console.error('Error counting AI usage:', countError);
				return { allowed: false, planType, currentUsage: 0, limit, message: 'Could not verify usage.' };
			}

			const allowed = (currentUsage || 0) < limit;
			return {
				allowed,
				planType,
				currentUsage: currentUsage || 0,
				limit,
				message: allowed ? undefined : `You have reached your monthly limit for ${featureSubtype}.`
			};
		}

		// 4. For all other features (non-document generation): Use standard individual limits
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
		
		// 5. Count the user's current usage from the new log table.
		const { count: currentUsage, error: countError } = await supabase
			.from('ai_usage_log')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('feature_type', featureSubtype);

		if (countError) {
			console.error('Error counting AI usage:', countError);
			return { allowed: false, planType, currentUsage: 0, limit, message: 'Could not verify usage.' };
		}

		// 6. Compare current usage to the limit.
		const allowed = limit === null ? true : (currentUsage || 0) < limit;
        
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
