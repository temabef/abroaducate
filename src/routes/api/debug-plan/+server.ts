import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkComprehensiveUsageLimit } from '$lib/comprehensive-usage-limits';

export const GET: RequestHandler = async ({ locals: { getSession } }) => {
    const session = await getSession();

    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get user's subscription info
        const { supabase } = locals;
        
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Check usage limits for different AI features
        const featureTypes = ['reviews', 'text_enhancements', 'word_optimizations', 'grammar_check', 'plagiarism_checks', 'tone_analysis'];
        
        const usageChecks = {};
        for (const featureType of featureTypes) {
            try {
                const check = await checkComprehensiveUsageLimit(session.user.id, featureType);
                usageChecks[featureType] = check;
            } catch (error) {
                usageChecks[featureType] = { error: error.message };
            }
        }

        return json({
            userId: session.user.id,
            userEmail: session.user.email,
            subscription: subscription || { error: subError?.message || 'No active subscription found' },
            usageChecks,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Debug plan error:', error);
        return json({ 
            error: error.message || 'Internal server error',
            userId: session.user.id 
        }, { status: 500 });
    }
}; 