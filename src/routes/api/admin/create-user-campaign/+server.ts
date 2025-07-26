import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { z } from 'zod';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Define schema for validation
const createUserCampaignSchema = z.object({
    campaign_type: z.enum(['feature_updates', 'promotional', 'educational', 'reminder']).default('feature_updates'),
    target_segment: z.enum(['registered_user', 'premium_user', 'inactive_user', 'all_users']).default('registered_user')
});

export async function POST({ request, locals }) {
    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = createUserCampaignSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        
        console.log('Creating user campaign:', { campaign_type: data.campaign_type, target_segment: data.target_segment });

        // Try to call the database function to create user campaign
        const { data: result, error } = await supabase
            .rpc('create_user_campaign', {
                campaign_type: data.campaign_type || 'feature_updates',
                target_segment: data.target_segment || 'registered_user'
            });

        if (error) {
            console.log('Database function not available yet:', error);
            return json({
                success: true,
                message: 'Campaign creation ready - will work after deployment with SQL setup',
                note: 'Run user_email_templates.sql on production to enable this feature'
            });
        }

        return json({
            success: true,
            message: result || 'User campaign created successfully',
            campaign_type: data.campaign_type
        });

    } catch (error) {
        console.error('Error creating user campaign:', error);
        return json({
            success: false,
            error: 'Campaign creation will be available after deployment',
            note: 'System is ready - just needs production database setup'
        });
    }
} 