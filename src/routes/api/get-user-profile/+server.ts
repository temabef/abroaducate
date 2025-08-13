import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get user's subscription info
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('plan_type, status, created_at, updated_at')
            .eq('user_id', session.user.id)
            .in('status', ['active','trialing'])
            .single();

        if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Subscription query error:', subError);
        }

        // Get user's current usage
        const { data: usageData, error: usageError } = await supabase.rpc('get_current_usage', {
            user_uuid: session.user.id
        });

        if (usageError) {
            console.error('Usage query error:', usageError);
        }

        // Get plan limits
        const planType = subscription?.plan_type || 'free';
        const { data: planLimits, error: limitsError } = await supabase
            .from('plan_limits')
            .select('*')
            .eq('plan_type', planType)
            .single();

        if (limitsError) {
            console.error('Plan limits query error:', limitsError);
        }

        const userProfile = {
            user: {
                id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at
            },
            subscription: {
                plan_type: planType,
                status: subscription?.status || 'active',
                created_at: subscription?.created_at,
                updated_at: subscription?.updated_at
            },
            usage: {
                sops_created: usageData?.[0]?.sops_created || 0,
                cover_letters_created: usageData?.[0]?.cover_letters_created || 0,
                personal_statements_created: usageData?.[0]?.personal_statements_created || 0,
                academic_cvs_created: usageData?.[0]?.academic_cvs_created || 0,
                ai_improvements_used: usageData?.[0]?.ai_improvements_used || 0,
                analytics_generated: usageData?.[0]?.analytics_generated || 0,
                plagiarism_checks: usageData?.[0]?.plagiarism_checks || 0
            },
            limits: {
                sops_limit: planLimits?.sops_limit,
                cover_letters_limit: planLimits?.cover_letters_limit,
                personal_statements_limit: planLimits?.personal_statements_limit,
                academic_cvs_limit: planLimits?.academic_cvs_limit,
                ai_improvements_limit: planLimits?.ai_improvements_limit,
                analytics_limit: planLimits?.analytics_limit,
                plagiarism_checks_limit: planLimits?.plagiarism_checks_limit
            }
        };

        return json(userProfile);

    } catch (error) {
        console.error('Error getting user profile:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 