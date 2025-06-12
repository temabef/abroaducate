import type { SupabaseClient } from '@supabase/supabase-js';

export interface UsageLimits {
    sops_limit: number | null;
    ai_improvements_limit: number | null;
    analytics_limit: number | null;
    plagiarism_checks_limit: number | null;
}

export interface CurrentUsage {
    sops_created: number;
    ai_improvements_used: number;
    analytics_generated: number;
    plagiarism_checks: number;
}

/**
 * Check if user can perform a specific action based on their plan limits
 */
export async function checkUsageLimit(
    supabase: SupabaseClient,
    userId: string,
    usageType: 'sops_created' | 'cover_letters_created' | 'personal_statements_created' | 'academic_cvs_created' | 'ai_improvements_used' | 'analytics_generated' | 'plagiarism_checks',
    increment: number = 1
): Promise<{ allowed: boolean; planType: string; currentUsage: number; limit: number | null; message?: string }> {
    try {
        // Get user's current plan
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const planType = subscription?.plan_type || 'free';

        // Get plan limits
        const { data: planLimits } = await supabase
            .from('plan_limits')
            .select('*')
            .eq('plan_type', planType)
            .single();

        if (!planLimits) {
            return {
                allowed: false,
                planType,
                currentUsage: 0,
                limit: 0,
                message: 'Plan configuration not found'
            };
        }

        // Map usage types to their corresponding limit columns
        let limitColumn: string;
        switch (usageType) {
            case 'sops_created':
                limitColumn = 'sops_limit';
                break;
            case 'cover_letters_created':
                limitColumn = 'cover_letters_limit';
                break;
            case 'personal_statements_created':
                limitColumn = 'personal_statements_limit';
                break;
            case 'academic_cvs_created':
                limitColumn = 'academic_cvs_limit';
                break;
            case 'ai_improvements_used':
                limitColumn = 'ai_improvements_limit';
                break;
            case 'analytics_generated':
                limitColumn = 'analytics_limit';
                break;
            case 'plagiarism_checks':
                limitColumn = 'plagiarism_checks_limit';
                break;
            default:
                limitColumn = 'sops_limit';
        }
        
        const limit = planLimits[limitColumn];
        
        // If limit is null (unlimited), allow action
        if (limit === null) {
            return {
                allowed: true,
                planType,
                currentUsage: 0,
                limit: null
            };
        }

        // Get current usage using the database function
        const { data: usageData } = await supabase.rpc('get_current_usage', {
            user_uuid: userId
        });

        const currentUsage = usageData?.[0]?.[usageType] || 0;

        // Check if adding increment would exceed limit
        const wouldExceed = (currentUsage + increment) > limit;

        return {
            allowed: !wouldExceed,
            planType,
            currentUsage,
            limit,
            message: wouldExceed ? `You've reached your ${usageType.replace('_', ' ')} limit for your ${planType} plan.` : undefined
        };

    } catch (error) {
        console.error('Error checking usage limit:', error);
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
 * Increment usage counter after successful action
 */
export async function incrementUsage(
    supabase: SupabaseClient,
    userId: string,
    usageType: 'sops_created' | 'cover_letters_created' | 'personal_statements_created' | 'academic_cvs_created' | 'ai_improvements_used' | 'analytics_generated' | 'plagiarism_checks',
    increment: number = 1
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('increment_usage', {
            user_uuid: userId,
            usage_type: usageType,
            increment_by: increment
        });

        if (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('Error incrementing usage:', error);
        return false;
    }
}

/**
 * Get user's current usage and limits
 */
export async function getUserUsageStatus(
    supabase: SupabaseClient,
    userId: string
): Promise<{
    planType: string;
    usage: CurrentUsage;
    limits: UsageLimits;
    percentages: Record<string, number>;
}> {
    try {
        // Get user's current plan
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const planType = subscription?.plan_type || 'free';

        // Get plan limits
        const { data: planLimits } = await supabase
            .from('plan_limits')
            .select('*')
            .eq('plan_type', planType)
            .single();

        // Get current usage
        const { data: usageData } = await supabase.rpc('get_current_usage', {
            user_uuid: userId
        });

        const usage: CurrentUsage = {
            sops_created: usageData?.[0]?.sops_created || 0,
            ai_improvements_used: usageData?.[0]?.ai_improvements_used || 0,
            analytics_generated: usageData?.[0]?.analytics_generated || 0,
            plagiarism_checks: usageData?.[0]?.plagiarism_checks || 0
        };

        const limits: UsageLimits = {
            sops_limit: planLimits?.sops_limit || 1,
            ai_improvements_limit: planLimits?.ai_improvements_limit || 3,
            analytics_limit: planLimits?.analytics_limit || 1,
            plagiarism_checks_limit: planLimits?.plagiarism_checks_limit || 1
        };

        // Calculate usage percentages
        const percentages: Record<string, number> = {};
        Object.keys(usage).forEach(key => {
            const usageKey = key as keyof CurrentUsage;
            const limitKey = `${key.replace('_used', '').replace('_created', '').replace('_generated', '')}_limit` as keyof UsageLimits;
            const limit = limits[limitKey];
            
            if (limit === null) {
                percentages[key] = 0; // Unlimited
            } else {
                percentages[key] = Math.min(100, (usage[usageKey] / limit) * 100);
            }
        });

        return {
            planType,
            usage,
            limits,
            percentages
        };

    } catch (error) {
        console.error('Error getting usage status:', error);
        return {
            planType: 'free',
            usage: { sops_created: 0, ai_improvements_used: 0, analytics_generated: 0, plagiarism_checks: 0 },
            limits: { sops_limit: 1, ai_improvements_limit: 3, analytics_limit: 1, plagiarism_checks_limit: 1 },
            percentages: { sops_created: 0, ai_improvements_used: 0, analytics_generated: 0, plagiarism_checks: 0 }
        };
    }
} 