import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function POST({ request }) {
    try {
        // Simple security: check for a cron token (you can set this in your environment)
        const cronToken = request.headers.get('x-cron-token');
        // For now, we'll allow it to run - add your own security token if needed
        
        console.log('Running weekly scholarship automation...');

        // Call the database function to create weekly scholarship campaign
        const { data, error } = await supabase
            .rpc('run_weekly_scholarship_automation');

        if (error) {
            console.error('Error running weekly scholarship automation:', error);
            return json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        console.log('Weekly scholarship automation result:', data);

        return json({
            success: true,
            message: data || 'Weekly scholarship automation completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in weekly scholarship automation:', error);
        return json({
            success: false,
            error: 'Failed to run weekly scholarship automation',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Also allow GET for testing
export async function GET() {
    return json({
        message: 'Weekly scholarship automation endpoint',
        usage: 'Send POST request to trigger weekly scholarship email creation',
        schedule: 'Recommended: Every Monday at 9 AM',
        note: 'This will automatically create and schedule scholarship digest emails for your imported leads'
    });
} 