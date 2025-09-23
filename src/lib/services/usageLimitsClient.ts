// =====================================================
// CLIENT-SAFE USAGE LIMITS SERVICE
// No private environment variables - safe for browser
// =====================================================

export interface UsageCheck {
  allowed: boolean;
  planType: string;
  currentUsage: number;
  limit: number | null;
  message?: string;
}

// CLIENT-SAFE LIMITS CONFIGURATION (no sensitive data)
export const FEATURE_LIMITS: Record<string, Record<string, number | null>> = {
  free: {
    // Document Generation
    sop_generation: 1,
    cover_letter_generation: 1,
    personal_statement_generation: 1,
    academic_cv_generation: 1,
    total_documents: 4,
    
    // AI Enhancement Features
    reviews: 1,
    text_enhancements: 1,
    word_optimizations: 1,
    grammar_check: 1,
    plagiarism_checks: 1,
    tone_analysis: 1,
    inline_edits: 5,
    
    // Cold Email Generator
    cold_email_generation: 5,
    
    // Visa Interview
    visa_interview_questions: 6,
    
    // University Matching
    university_matching: 50,
    university_queries: 5,
    
    // Application Tracking
    application_tracking: 12,
    
    // Document Checklist Limits
    document_checklists: null,
    checklist_progress: null,
    
    // Alternative names for compatibility
    sop_review: 1,
    text_enhancement: 1,
    word_optimization: 1,
    plagiarism_check: 1
  },
  professional: {
    // Document Generation
    sop_generation: 50,
    cover_letter_generation: 50,
    personal_statement_generation: 50,
    academic_cv_generation: 50,
    total_documents: 50,
    
    // AI Enhancement Features
    reviews: 15,
    text_enhancements: 25,
    word_optimizations: 15,
    grammar_check: 25,
    plagiarism_checks: 10,
    tone_analysis: 25,
    inline_edits: 50,
    
    // Cold Email Generator
    cold_email_generation: 50,
    
    // Visa Interview
    visa_interview_questions: 50,
    
    // University Matching
    university_matching: 500,
    university_queries: 25,
    
    // Application Tracking
    application_tracking: 1000,
    
    // Document Checklist Limits
    document_checklists: null,
    checklist_progress: null,
    
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
    
    // Cold Email Generator
    cold_email_generation: 500,
    
    // Visa Interview
    visa_interview_questions: 80,
    
    // University Matching
    university_matching: 1500,
    university_queries: null,
    
    // Application Tracking - UNLIMITED
    application_tracking: null,
    
    // Document Checklist Limits
    document_checklists: null,
    checklist_progress: null,
    
    // Alternative names for compatibility
    sop_review: null,
    text_enhancement: null,
    word_optimization: null,
    plagiarism_check: null
  }
};

/**
 * Client-safe function to check usage via API
 */
export async function checkUsageLimit(
  featureType: string,
  userId?: string
): Promise<UsageCheck> {
  try {
    const response = await fetch('/api/check-usage-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        featureType,
        userId 
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to check usage limit');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return {
      allowed: false,
      planType: 'free',
      currentUsage: 0,
      limit: 0,
      message: 'Could not verify usage limit'
    };
  }
}

/**
 * Get the limit for a feature and plan (client-safe)
 */
export function getFeatureLimit(planType: string, featureType: string): number | null {
  return FEATURE_LIMITS[planType]?.[featureType] ?? 0;
}

/**
 * Check if a feature is available for a plan (client-safe)
 */
export function isFeatureAvailable(planType: string, featureType: string): boolean {
  const limit = FEATURE_LIMITS[planType]?.[featureType];
  return limit !== undefined;
}

/**
 * Get display text for usage limits (client-safe)
 */
export function getUsageDisplayText(current: number, limit: number | null): string {
  if (limit === null) return 'Unlimited';
  return `${current}/${limit} used`;
}

