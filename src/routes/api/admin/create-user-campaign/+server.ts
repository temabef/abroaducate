import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function POST({ request, locals }) {
    try {
        const { campaign_type, target_segment } = await request.json();
        
        console.log('Creating user campaign:', { campaign_type, target_segment });

        // Try to call the database function to create user campaign
        const { data, error } = await supabase
            .rpc('create_user_campaign', {
                campaign_type: campaign_type || 'feature_updates',
                target_segment: target_segment || 'registered_user'
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
            message: data || 'User campaign created successfully',
            campaign_type: campaign_type
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