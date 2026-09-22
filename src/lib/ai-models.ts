import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the appropriate AI model based on user's subscription tier
 */
export async function getAIModelForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<string> {
    try {
        // Get user's current plan (be resilient to multiple rows)
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type, created_at')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const planType = subscription?.plan_type || 'free';

        // Return modern, fast, low-cost gpt-4o-mini for all users
        switch (planType) {
            case 'elite':
                return 'gpt-4o'; // Best quality if specified
            case 'professional':
            case 'free':
            default:
                return 'gpt-4o-mini'; // Modern, fast, and high quality
        }
    } catch (error) {
        console.error('Error getting AI model for user:', error);
        return 'gpt-4o-mini'; // Default to gpt-4o-mini on error
    }
}

/**
 * Get model configuration including temperature and max tokens based on document type and subscription
 */
export async function getModelConfig(
    supabase: SupabaseClient,
    userId: string,
    documentType: 'sop' | 'cover-letter' | 'personal-statement' | 'academic-cv'
): Promise<{
    model: string;
    temperature: number;
    max_tokens: number;
}> {
    const model = await getAIModelForUser(supabase, userId);
    
    // Document-specific configurations
    const configs = {
        'sop': {
            temperature: 0.7,
            max_tokens: model.includes('gpt-4') ? 2000 : 1500
        },
        'cover-letter': {
            temperature: 0.7,
            max_tokens: model.includes('gpt-4') ? 2500 : 2000
        },
        'personal-statement': {
            temperature: 0.8, // Higher creativity for personal narratives
            max_tokens: model.includes('gpt-4') ? 2500 : 2000
        },
        'academic-cv': {
            temperature: 0.3, // Lower creativity for structured documents
            max_tokens: model.includes('gpt-4') ? 2500 : 2000
        }
    };

    return {
        model,
        ...configs[documentType]
    };
} 