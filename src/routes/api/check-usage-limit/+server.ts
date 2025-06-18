import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkUsageLimit } from '$lib/usage-limits';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { usageType } = await request.json();
        
        if (!usageType) {
            return json({ error: 'Usage type is required' }, { status: 400 });
        }
        
        const usageCheck = await checkUsageLimit(supabase, session.user.id, usageType);
        
        return json({
            success: true,
            allowed: usageCheck.allowed,
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
            planType: usageCheck.planType,
            message: usageCheck.message,
            usageType
        });
        
    } catch (error) {
        console.error('Error checking usage limit:', error);
        return json({ 
            error: 'Failed to check usage limit',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 