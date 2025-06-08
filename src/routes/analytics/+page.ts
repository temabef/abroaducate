import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
    const { supabase, session } = await parent();
    
    if (!session) {
        throw redirect(303, '/auth/login');
    }
    
    // Check if user has access to analytics (Basic+ plans)
    try {
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();
        
        const planType = subscription?.plan_type || 'free';
        
        if (planType === 'free') {
            throw redirect(303, '/account?upgrade=analytics');
        }
    } catch (error) {
        // If error checking subscription, redirect to account
        throw redirect(303, '/account');
    }
    
    return {
        supabase,
        session
    };
}; 