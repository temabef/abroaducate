import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleAIFeatureRequest, type AIFeatureRequest } from '$lib/services/aiFeatureService';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const requestData = await request.json();
        
        // Validate required fields
        if (!requestData.type || !requestData.content) {
            return json({ 
                error: 'Missing required fields: type and content' 
            }, { status: 400 });
        }
        
        // Create AI feature request
        const aiRequest: AIFeatureRequest = {
            type: requestData.type,
            userId: session.user.id,
            content: requestData.content,
            options: requestData.options || {}
        };
        
        // Process the request
        const response = await handleAIFeatureRequest(supabase, aiRequest);
        
        if (!response.success) {
            // Check if it's a usage limit issue
            if (response.error?.includes('Usage limit exceeded')) {
                return json({
                    error: response.error,
                    upgradeRequired: true,
                    usageData: response.usageData
                }, { status: 403 });
            }
            
            return json({ 
                error: response.error || 'AI processing failed' 
            }, { status: 500 });
        }
        
        return json({
            success: true,
            result: response.result,
            usageData: response.usageData
        });
        
    } catch (error) {
        console.error('AI Features API error:', error);
        return json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}; 