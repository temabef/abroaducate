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
            .in('status', ['active', 'trialing'])
            .limit(1)
            .maybeSingle();

        const planType = subscription?.plan_type || 'free';

        // Get current month's usage
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const { data: currentUsage } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('month_year', currentMonth)
            .single();

        // Define limits based on plan type
        const planLimits = {
            free: {
                sops_created: 2,
                cover_letters_created: 2,
                personal_statements_created: 1,
                academic_cvs_created: 1,
                ai_improvements_used: 2,
                analytics_generated: 1,
                plagiarism_checks: 1
            },
            professional: {
                sops_created: 15,
                cover_letters_created: 15,
                personal_statements_created: 10,
                academic_cvs_created: 10,
                ai_improvements_used: 25,
                analytics_generated: 10,
                plagiarism_checks: 10
            },
            elite: {
                sops_created: null,
                cover_letters_created: null,
                personal_statements_created: null,
                academic_cvs_created: null,
                ai_improvements_used: null,
                analytics_generated: null,
                plagiarism_checks: null
            }
        } as const;

        const limits = planLimits[planType as keyof typeof planLimits] || planLimits.free;
        const usage = currentUsage?.[usageType] || 0;
        const currentLimit = limits[usageType];

        // If limit is null (unlimited) or usage + increment is within limit
        const allowed = currentLimit === null || usage + increment <= currentLimit;

        return {
            allowed,
            planType,
            currentUsage: usage,
            limit: currentLimit,
            message: allowed ? undefined : `You've reached your ${usageType.replace(/_/g, ' ')} limit for your ${planType} plan.`
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
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // First check if we can increment
        const usageCheck = await checkUsageLimit(supabase, userId, usageType, increment);
        if (!usageCheck.allowed) {
            return false;
        }

        // Get current usage first
        const { data: currentUsage } = await supabase
            .from('user_usage')
            .select(usageType)
            .eq('user_id', userId)
            .eq('month_year', currentMonth)
            .single();

        // Type assertion since we know the shape of the data
        const currentValue = ((currentUsage as Record<string, number | null>)?.[usageType] ?? 0);

        // Update with the new value
        const { data, error } = await supabase
            .from('user_usage')
            .upsert({
                user_id: userId,
                month_year: currentMonth,
                [usageType]: currentValue + increment
            }, {
                onConflict: 'user_id, month_year'
            });

        if (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }

        return true;
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
    usage: Record<string, number>;
    limits: Record<string, number | null>;
    percentages: Record<string, number>;
}> {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Get user's current plan
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .limit(1)
            .maybeSingle();

        const planType = subscription?.plan_type || 'free';

        // Get current usage
        const { data: currentUsage } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('month_year', currentMonth)
            .single();

        const usage = {
            sops_created: currentUsage?.sops_created || 0,
            cover_letters_created: currentUsage?.cover_letters_created || 0,
            personal_statements_created: currentUsage?.personal_statements_created || 0,
            academic_cvs_created: currentUsage?.academic_cvs_created || 0,
            ai_improvements_used: currentUsage?.ai_improvements_used || 0,
            analytics_generated: currentUsage?.analytics_generated || 0,
            plagiarism_checks: currentUsage?.plagiarism_checks || 0
        };

        // Define limits based on plan type
        const planLimits = {
            free: {
                sops_created: 2,
                cover_letters_created: 2,
                personal_statements_created: 1,
                academic_cvs_created: 1,
                ai_improvements_used: 2,
                analytics_generated: 1,
                plagiarism_checks: 1
            },
            professional: {
                sops_created: 15,
                cover_letters_created: 15,
                personal_statements_created: 10,
                academic_cvs_created: 10,
                ai_improvements_used: 25,
                analytics_generated: 10,
                plagiarism_checks: 10
            },
            elite: {
                sops_created: null,
                cover_letters_created: null,
                personal_statements_created: null,
                academic_cvs_created: null,
                ai_improvements_used: null,
                analytics_generated: null,
                plagiarism_checks: null
            }
        } as const;

        const limits = planLimits[planType as keyof typeof planLimits] || planLimits.free;

        // Calculate percentages
        const percentages: Record<string, number> = {};
        Object.keys(usage).forEach(key => {
            const limit = limits[key as keyof typeof limits];
            if (limit === null) {
                percentages[key] = 0; // Unlimited
            } else {
                percentages[key] = Math.min(100, (usage[key as keyof typeof usage] / limit) * 100);
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
            usage: {
                sops_created: 0,
                cover_letters_created: 0,
                personal_statements_created: 0,
                academic_cvs_created: 0,
                ai_improvements_used: 0,
                analytics_generated: 0,
                plagiarism_checks: 0
            },
            limits: {
                sops_created: 2,
                cover_letters_created: 2,
                personal_statements_created: 1,
                academic_cvs_created: 1,
                ai_improvements_used: 2,
                analytics_generated: 1,
                plagiarism_checks: 1
            },
            percentages: {
                sops_created: 0,
                cover_letters_created: 0,
                personal_statements_created: 0,
                academic_cvs_created: 0,
                ai_improvements_used: 0,
                analytics_generated: 0,
                plagiarism_checks: 0
            }
        };
    }
} 