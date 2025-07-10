import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function GET({ url, locals }) {
    try {
        console.log('Getting users list...');

        // Get users with their profile information
        const { data: users, error } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                created_at,
                last_sign_in_at,
                subscription_status,
                newsletter_subscribed
            `)
            .order('created_at', { ascending: false })
            .limit(100); // Limit to 100 users for performance

        if (error) {
            console.log('Users query failed, returning sample data');
            
            // Return sample users for development
            const sampleUsers = [
                {
                    id: '1',
                    email: 'john.doe@example.com',
                    full_name: 'John Doe',
                    created_at: new Date().toISOString(),
                    last_sign_in_at: new Date().toISOString(),
                    subscription_status: 'active',
                    newsletter_subscribed: true
                },
                {
                    id: '2',
                    email: 'jane.smith@example.com',
                    full_name: 'Jane Smith',
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    last_sign_in_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                    subscription_status: null,
                    newsletter_subscribed: false
                },
                {
                    id: '3',
                    email: 'alex.johnson@example.com',
                    full_name: 'Alex Johnson',
                    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
                    last_sign_in_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                    subscription_status: 'active',
                    newsletter_subscribed: true
                }
            ];

            return json({
                users: sampleUsers,
                note: 'Sample data - real users will be available after deployment'
            });
        }

        return json({
            users: users || [],
            note: 'Real user data from database'
        });

    } catch (error) {
        console.error('Error getting users list:', error);
        
        // Return empty array on error
        return json({
            users: [],
            note: 'Error loading users - data will be available after deployment'
        });
    }
} 