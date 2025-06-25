import { json } from '@sveltejs/kit';
import { checkComprehensiveUsageLimit } from '$lib/comprehensive-usage-limits';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase, getSession } }) => {
    try {
        const session = await getSession();
        
        if (!session) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const usageType = url.searchParams.get('type');
        
        if (!usageType) {
            return json({ error: 'Usage type parameter is required' }, { status: 400 });
        }

        // Use new comprehensive usage limits system
        const usageCheck = await checkComprehensiveUsageLimit(session.user.id, usageType);
        
        return json({
            success: true,
            allowed: usageCheck.allowed,
            planType: usageCheck.planType,
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
            message: usageCheck.message
        });

    } catch (error) {
        console.error('Error checking usage limit:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 