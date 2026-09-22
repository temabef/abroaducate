import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// COMPREHENSIVE USAGE LIMITS
// Abroaducate is a 100% free platform supported by verified relocation partners.
// All features are available to registered students without paywalls.

export interface ComprehensiveUsageCheck {
	allowed: boolean;
	planType: string;
	currentUsage: number;
	limit: number | null;
	message?: string;
}

// 100% Free platform limits - all features unlocked
const AI_FEATURE_LIMITS: Record<string, Record<string, number | null>> = {
	free: {
		// Document Generation - Unlimited for registered students
		sop_generation: null,
		cover_letter_generation: null,
		personal_statement_generation: null,
		academic_cv_generation: null,
		total_documents: null,
		
		// AI Enhancement Features
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null,
		inline_edits: null,
		
		// Cold Email Generator
		cold_email_generation: null,
		
		// Visa Interview Practice
		visa_interview_questions: null,
		
		// University Matching
		university_matching: null,
		university_queries: null,
		
		// Application Tracking
		application_tracking: null,

		// Scholarship intelligence
		scholarship_win_strategy: null,
		
		// Document Checklist Limits
		document_checklists: null,
		checklist_progress: null,
		
		// Alternative names for compatibility
		sop_review: null,
		text_enhancement: null,
		word_optimization: null,
		plagiarism_check: null
	},
	professional: {
		sop_generation: null,
		cover_letter_generation: null,
		personal_statement_generation: null,
		academic_cv_generation: null,
		total_documents: null,
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null,
		inline_edits: null,
		cold_email_generation: null,
		visa_interview_questions: null,
		university_matching: null,
		university_queries: null,
		application_tracking: null,
		scholarship_win_strategy: null,
		document_checklists: null,
		checklist_progress: null,
		sop_review: null,
		text_enhancement: null,
		word_optimization: null,
		plagiarism_check: null
	},
	elite: {
		sop_generation: null,
		cover_letter_generation: null,
		personal_statement_generation: null,
		academic_cv_generation: null,
		total_documents: null,
		reviews: null,
		text_enhancements: null,
		word_optimizations: null,
		grammar_check: null,
		plagiarism_checks: null,
		tone_analysis: null,
		inline_edits: null,
		cold_email_generation: null,
		visa_interview_questions: null,
		university_matching: null,
		university_queries: null,
		application_tracking: null,
		scholarship_win_strategy: null,
		document_checklists: null,
		checklist_progress: null,
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
 * Abroaducate is 100% free — all features are unlocked with no paywalls.
 */
export async function checkComprehensiveUsageLimit(
    userId: string,
	featureSubtype: string
): Promise<ComprehensiveUsageCheck> {
	return {
		allowed: true,
		planType: 'free',
		currentUsage: 0,
		limit: null
	};
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
