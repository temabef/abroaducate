import type { SupabaseClient } from '@supabase/supabase-js';
import { getFeatureLimit, hasFeatureAccess, getAIModel } from './stripe';

/**
 * COMPREHENSIVE USAGE LIMIT SYSTEM
 * Handles ALL features from your pricing page:
 * - Document generation (SOPs, cover letters, personal statements, academic CVs)
 * - AI features (reviews, text enhancements, word optimizations, plagiarism checks)
 * - University matching queries
 * - Visa interview sessions
 * - Cold email generation
 * - Academic analysis features
 * - Template access and export formats
 * - Version control and analytics
 */

export interface ComprehensiveUsageCheck {
    allowed: boolean;
    planType: string;
    currentUsage: number;
    limit: number | null;
    message?: string;
    upgradePrompt?: string;
    featureMetadata?: any;
}

/**
 * Main comprehensive usage checker - handles ALL feature types
 */
export async function checkComprehensiveUsageLimit(
    supabase: SupabaseClient,
    userId: string,
    featureType: string,
    featureSubtype?: string,
    increment: number = 1
): Promise<ComprehensiveUsageCheck> {
    try {
        // Get user's current plan
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const planType = subscription?.plan_type || 'free';

        // Get current usage data
        const { data: usageData } = await supabase.rpc('get_comprehensive_usage', {
            user_uuid: userId
        });

        const usage = usageData?.[0] || {};

        // Route to specific feature checkers
        switch (featureType) {
            case 'document_generation':
                return await checkDocumentGenerationLimit(
                    planType, usage, featureSubtype, increment
                );
                
            case 'ai_features':
                return await checkAIFeatureLimit(
                    planType, usage, featureSubtype, increment
                );
                
            case 'university_matching':
                return await checkUniversityMatchingLimit(
                    planType, usage, increment
                );
                
            case 'visa_interview':
                return await checkVisaInterviewLimit(
                    planType, usage, increment
                );
                
            case 'cold_email':
                return await checkColdEmailAccess(planType);
                
            case 'academic_analysis':
                return await checkAcademicAnalysisAccess(planType, featureSubtype);
                
            case 'template_access':
                return await checkTemplateAccess(planType, featureSubtype);
                
            case 'export_formats':
                return await checkExportFormatAccess(planType, featureSubtype);
                
            case 'version_control':
                return await checkVersionControlAccess(planType, featureSubtype);
                
            case 'advanced_features':
                return await checkAdvancedFeatureAccess(planType, featureSubtype);
                
            default:
                return {
                    allowed: false,
                    planType,
                    currentUsage: 0,
                    limit: 0,
                    message: `Unknown feature type: ${featureType}`
                };
        }

    } catch (error) {
        console.error('Error checking comprehensive usage limit:', error);
        return {
            allowed: false,
            planType: 'free',
            currentUsage: 0,
            limit: 0,
            message: 'Error checking usage limits'
        };
    }
}

/**
 * Document Generation Limits
 * Handles the complex logic for different document types and plan structures
 */
async function checkDocumentGenerationLimit(
    planType: string,
    usage: any,
    documentType?: string,
    increment: number = 1
): Promise<ComprehensiveUsageCheck> {
    if (planType === 'professional') {
        // Professional tier: 50 documents total, any combination
        const totalUsed = (usage.sops_created || 0) + 
                         (usage.cover_letters_created || 0) + 
                         (usage.personal_statements_created || 0) + 
                         (usage.academic_cvs_created || 0);
        
        const limit = 50;
        const allowed = totalUsed + increment <= limit;
        
        return {
            allowed,
            planType,
            currentUsage: totalUsed,
            limit,
            message: allowed ? undefined : 'Monthly document limit reached (50 documents total)',
            upgradePrompt: allowed ? undefined : 'Upgrade to Elite for unlimited documents'
        };
        
    } else if (planType === 'elite') {
        // Elite tier: Unlimited documents
        return {
            allowed: true,
            planType,
            currentUsage: 0,
            limit: null,
            message: undefined
        };
        
    } else {
        // Free tier: Individual document type limits
        const documentLimits = {
            'sop': { usage: usage.sops_created || 0, limit: 2 },
            'cover_letter': { usage: usage.cover_letters_created || 0, limit: 2 },
            'personal_statement': { usage: usage.personal_statements_created || 0, limit: 1 },
            'academic_cv': { usage: usage.academic_cvs_created || 0, limit: 1 }
        };
        
        const docLimit = documentLimits[documentType as keyof typeof documentLimits];
        if (!docLimit) {
            return {
                allowed: false,
                planType,
                currentUsage: 0,
                limit: 0,
                message: 'Invalid document type'
            };
        }
        
        const allowed = docLimit.usage + increment <= docLimit.limit;
        
        return {
            allowed,
            planType,
            currentUsage: docLimit.usage,
            limit: docLimit.limit,
            message: allowed ? undefined : `Monthly ${documentType} limit reached`,
            upgradePrompt: allowed ? undefined : 'Upgrade to Professional for 50 documents/month'
        };
    }
}

/**
 * AI Features Limits
 * Reviews, Text Enhancements, Word Optimizations, Plagiarism Checks
 */
async function checkAIFeatureLimit(
    planType: string,
    usage: any,
    aiFeatureType?: string,
    increment: number = 1
): Promise<ComprehensiveUsageCheck> {
    const aiFeatureLimits = {
        free: {
            reviews: { usage: usage.reviews_used || 0, limit: 3 },
            text_enhancements: { usage: usage.text_enhancements_used || 0, limit: 5 },
            word_optimizations: { usage: usage.word_optimizations_used || 0, limit: 3 },
            plagiarism_checks: { usage: usage.plagiarism_checks_used || 0, limit: 1 }
        },
        professional: {
            reviews: { usage: usage.reviews_used || 0, limit: 15 },
            text_enhancements: { usage: usage.text_enhancements_used || 0, limit: 25 },
            word_optimizations: { usage: usage.word_optimizations_used || 0, limit: 15 },
            plagiarism_checks: { usage: usage.plagiarism_checks_used || 0, limit: 10 }
        },
        elite: {
            reviews: { usage: usage.reviews_used || 0, limit: null },
            text_enhancements: { usage: usage.text_enhancements_used || 0, limit: null },
            word_optimizations: { usage: usage.word_optimizations_used || 0, limit: null },
            plagiarism_checks: { usage: usage.plagiarism_checks_used || 0, limit: null }
        }
    };
    
    const featureLimits = aiFeatureLimits[planType as keyof typeof aiFeatureLimits];
    const featureLimit = featureLimits[aiFeatureType as keyof typeof featureLimits];
    
    if (!featureLimit) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: 0,
            message: 'Invalid AI feature type'
        };
    }
    
    const allowed = featureLimit.limit === null || 
                   featureLimit.usage + increment <= featureLimit.limit;
    
    return {
        allowed,
        planType,
        currentUsage: featureLimit.usage,
        limit: featureLimit.limit,
        message: allowed ? undefined : `Monthly ${aiFeatureType} limit reached`,
        upgradePrompt: allowed ? undefined : 
            planType === 'free' ? 'Upgrade to Professional for enhanced AI features' :
            'Upgrade to Elite for unlimited AI features'
    };
}

/**
 * University Matching Limits
 */
async function checkUniversityMatchingLimit(
    planType: string,
    usage: any,
    increment: number = 1
): Promise<ComprehensiveUsageCheck> {
    const matchingLimits = {
        free: { usage: usage.university_queries_used || 0, limit: 5, universities: 50 },
        professional: { usage: usage.university_queries_used || 0, limit: 25, universities: 500 },
        elite: { usage: usage.university_queries_used || 0, limit: null, universities: 1500 }
    };
    
    const limits = matchingLimits[planType as keyof typeof matchingLimits];
    const allowed = limits.limit === null || limits.usage + increment <= limits.limit;
    
    return {
        allowed,
        planType,
        currentUsage: limits.usage,
        limit: limits.limit,
        message: allowed ? undefined : 'Monthly university matching limit reached',
        upgradePrompt: allowed ? undefined : 
            planType === 'free' ? 'Upgrade to Professional for 500+ universities' :
            'Upgrade to Elite for 1500+ universities with priority access',
        featureMetadata: { total_universities: limits.universities }
    };
}

/**
 * Visa Interview Session Limits
 */
async function checkVisaInterviewLimit(
    planType: string,
    usage: any,
    increment: number = 1
): Promise<ComprehensiveUsageCheck> {
    const questionsPerSession = {
        free: 5,
        professional: 20,
        elite: 30
    };
    
    const questions = questionsPerSession[planType as keyof typeof questionsPerSession];
    
    return {
        allowed: true, // Sessions are always allowed, just limited in questions
        planType,
        currentUsage: usage.visa_interview_sessions || 0,
        limit: null, // No session limit, just question limit
        message: undefined,
        featureMetadata: { questions_per_session: questions }
    };
}

/**
 * Cold Email Access Check
 */
async function checkColdEmailAccess(planType: string): Promise<ComprehensiveUsageCheck> {
    const access = {
        free: { enabled: false, level: 'none' },
        professional: { enabled: true, level: 'basic' },
        elite: { enabled: true, level: 'advanced' }
    };
    
    const accessLevel = access[planType as keyof typeof access];
    
    return {
        allowed: accessLevel.enabled,
        planType,
        currentUsage: 0,
        limit: null,
        message: accessLevel.enabled ? undefined : 'Cold email generator not available on free plan',
        upgradePrompt: accessLevel.enabled ? undefined : 'Upgrade to Professional for cold email templates',
        featureMetadata: { template_level: accessLevel.level }
    };
}

/**
 * Academic Analysis Access Check
 */
async function checkAcademicAnalysisAccess(
    planType: string, 
    analysisType?: string
): Promise<ComprehensiveUsageCheck> {
    const analysisAccess = {
        free: { quick: true, comprehensive: false },
        professional: { quick: true, comprehensive: true },
        elite: { quick: true, comprehensive: true }
    };
    
    const access = analysisAccess[planType as keyof typeof analysisAccess];
    
    if (analysisType === 'comprehensive' && !access.comprehensive) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: 'Comprehensive transcript analysis not available on free plan',
            upgradePrompt: 'Upgrade to Professional for comprehensive academic analysis'
        };
    }
    
    return {
        allowed: true,
        planType,
        currentUsage: 0,
        limit: null,
        message: undefined
    };
}

/**
 * Template Access Check
 */
async function checkTemplateAccess(
    planType: string, 
    templateType?: string
): Promise<ComprehensiveUsageCheck> {
    const templateAccess = {
        free: { basic: true, premium: false, custom: false, count: 6 },
        professional: { basic: true, premium: true, custom: false, count: 'all' },
        elite: { basic: true, premium: true, custom: true, count: 'all' }
    };
    
    const access = templateAccess[planType as keyof typeof templateAccess];
    
    if (templateType === 'premium' && !access.premium) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: 'Premium templates not available on free plan',
            upgradePrompt: 'Upgrade to Professional for premium templates'
        };
    }
    
    if (templateType === 'custom' && !access.custom) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: 'Custom template creation not available',
            upgradePrompt: 'Upgrade to Elite for custom template creation'
        };
    }
    
    return {
        allowed: true,
        planType,
        currentUsage: 0,
        limit: null,
        message: undefined
    };
}

/**
 * Export Format Access Check
 */
async function checkExportFormatAccess(
    planType: string, 
    format?: string
): Promise<ComprehensiveUsageCheck> {
    const formatAccess = {
        free: ['pdf', 'rtf'],
        professional: ['pdf', 'rtf', 'docx'],
        elite: ['pdf', 'rtf', 'docx', 'latex', 'custom']
    };
    
    const allowedFormats = formatAccess[planType as keyof typeof formatAccess];
    
    if (format && !allowedFormats.includes(format)) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: `${format.toUpperCase()} export not available on ${planType} plan`,
            upgradePrompt: planType === 'free' ? 
                'Upgrade to Professional for DOCX export' :
                'Upgrade to Elite for LaTeX and custom formats'
        };
    }
    
    return {
        allowed: true,
        planType,
        currentUsage: 0,
        limit: null,
        message: undefined,
        featureMetadata: { allowed_formats: allowedFormats }
    };
}

/**
 * Version Control Access Check
 */
async function checkVersionControlAccess(
    planType: string, 
    featureType?: string
): Promise<ComprehensiveUsageCheck> {
    const versionAccess = {
        free: { cover_letters_only: true, complete_history: false },
        professional: { cover_letters_only: false, complete_history: true },
        elite: { cover_letters_only: false, complete_history: true }
    };
    
    const access = versionAccess[planType as keyof typeof versionAccess];
    
    if (featureType === 'complete_history' && !access.complete_history) {
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: 'Complete version history not available on free plan',
            upgradePrompt: 'Upgrade to Professional for complete version history'
        };
    }
    
    return {
        allowed: true,
        planType,
        currentUsage: 0,
        limit: null,
        message: undefined
    };
}

/**
 * Advanced Features Access Check
 */
async function checkAdvancedFeatureAccess(
    planType: string, 
    featureType?: string
): Promise<ComprehensiveUsageCheck> {
    const advancedAccess = {
        free: {
            email_reminders: false,
            notifications: false,
            analytics_dashboard: false,
            insights_dashboard: false,
            early_access: false,
            custom_branding: false
        },
        professional: {
            email_reminders: true,
            notifications: true,
            analytics_dashboard: true,
            insights_dashboard: false,
            early_access: false,
            custom_branding: false
        },
        elite: {
            email_reminders: true,
            notifications: true,
            analytics_dashboard: true,
            insights_dashboard: true,
            early_access: true,
            custom_branding: true
        }
    };
    
    const access = advancedAccess[planType as keyof typeof advancedAccess];
    const hasAccess = access[featureType as keyof typeof access];
    
    if (!hasAccess) {
        const upgradeTarget = planType === 'free' ? 'Professional' : 'Elite';
        return {
            allowed: false,
            planType,
            currentUsage: 0,
            limit: null,
            message: `${featureType} not available on ${planType} plan`,
            upgradePrompt: `Upgrade to ${upgradeTarget} for ${featureType}`
        };
    }
    
    return {
        allowed: true,
        planType,
        currentUsage: 0,
        limit: null,
        message: undefined
    };
}

/**
 * Helper function to increment usage after successful operation
 */
export async function incrementComprehensiveUsage(
    supabase: SupabaseClient,
    userId: string,
    featureType: string,
    featureSubtype?: string,
    increment: number = 1
): Promise<boolean> {
    try {
        // Map feature types to database column names
        const usageMapping = {
            'document_generation': {
                'sop': 'sops_created',
                'cover_letter': 'cover_letters_created',
                'personal_statement': 'personal_statements_created',
                'academic_cv': 'academic_cvs_created'
            },
            'ai_features': {
                'reviews': 'reviews_used',
                'text_enhancements': 'text_enhancements_used',
                'word_optimizations': 'word_optimizations_used',
                'plagiarism_checks': 'plagiarism_checks_used'
            },
            'university_matching': {
                'query': 'university_queries_used'
            },
            'visa_interview': {
                'session': 'visa_interview_sessions'
            },
            'cold_email': {
                'generated': 'cold_emails_generated'
            },
            'academic_analysis': {
                'analysis': 'academic_analyses_used'
            }
        };
        
        const categoryMapping = usageMapping[featureType as keyof typeof usageMapping];
        if (!categoryMapping) return false;
        
        const usageColumn = categoryMapping[featureSubtype as keyof typeof categoryMapping];
        if (!usageColumn) return false;
        
        const { data, error } = await supabase.rpc('increment_comprehensive_usage', {
            user_uuid: userId,
            usage_type: usageColumn,
            increment_by: increment
        });
        
        return !error && data;
        
    } catch (error) {
        console.error('Error incrementing usage:', error);
        return false;
    }
}

/**
 * Get comprehensive usage summary for dashboard display
 */
export async function getComprehensiveUsageSummary(
    supabase: SupabaseClient,
    userId: string
): Promise<any> {
    try {
        const { data: usageData } = await supabase.rpc('get_comprehensive_usage', {
            user_uuid: userId
        });
        
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        
        const planType = subscription?.plan_type || 'free';
        const usage = usageData?.[0] || {};
        
        // Return comprehensive usage summary with limits and percentages
        return {
            planType,
            usage,
            documents: {
                current: (usage.sops_created || 0) + (usage.cover_letters_created || 0) + 
                        (usage.personal_statements_created || 0) + (usage.academic_cvs_created || 0),
                limit: getFeatureLimit(planType, 'documents', 'total')
            },
            ai_features: {
                reviews: { current: usage.reviews_used || 0, limit: getFeatureLimit(planType, 'ai_features', 'reviews') },
                text_enhancements: { current: usage.text_enhancements_used || 0, limit: getFeatureLimit(planType, 'ai_features', 'text_enhancements') },
                word_optimizations: { current: usage.word_optimizations_used || 0, limit: getFeatureLimit(planType, 'ai_features', 'word_optimizations') },
                plagiarism_checks: { current: usage.plagiarism_checks_used || 0, limit: getFeatureLimit(planType, 'ai_features', 'plagiarism_checks') }
            },
            university_matching: {
                current: usage.university_queries_used || 0,
                limit: getFeatureLimit(planType, 'university_matching', 'queries')
            },
            visa_interview: {
                sessions: usage.visa_interview_sessions || 0,
                questions_per_session: getFeatureLimit(planType, 'visa_interview', 'questions')
            }
        };
        
    } catch (error) {
        console.error('Error getting usage summary:', error);
        return null;
    }
} 