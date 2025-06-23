import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { 
            university_name, 
            program_name, 
            country,
            application_deadline,
            application_link,
            notes,
            linked_sop_ids = []
        } = await request.json();

        if (!university_name || !program_name) {
            return json({ error: 'University name and program name are required' }, { status: 400 });
        }

        // Check application limits based on subscription
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('user_id', session.user.id)
            .single();

        const subscriptionTier = profile?.subscription_tier || 'free';
        
        // Count existing applications
        const { count: existingCount, error: countError } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

        if (countError) {
            console.error('Error counting applications:', countError);
            return json({ error: 'Failed to check application limit' }, { status: 500 });
        }

        // Check limits
        const limits = {
            free: 12,
            professional: 1000,
            elite: Infinity
        };

        const userLimit = limits[subscriptionTier as keyof typeof limits] || limits.free;
        
        if (existingCount >= userLimit) {
            return json({ 
                error: `Application limit reached. ${subscriptionTier === 'free' ? 'Upgrade to Professional for 1000 applications.' : 'You have reached your application limit.'}`,
                limit_reached: true,
                current_count: existingCount,
                limit: userLimit === Infinity ? 'unlimited' : userLimit
            }, { status: 403 });
        }

        // Create simple requirements checklist
        const defaultRequirements = {
            sop: { 
                completed: linked_sop_ids.length > 0, 
                linked_sop_ids: linked_sop_ids,
                label: 'Statement of Purpose',
                required: true
            },
            transcripts: { 
                completed: false,
                label: 'Official Transcripts',
                required: true
            },
            letters_of_recommendation: { 
                completed: false,
                count: 0,
                required_count: 3,
                label: 'Letters of Recommendation',
                required: true
            },
            cv_resume: { 
                completed: false,
                label: 'CV/Resume',
                required: true
            },
            application_form: { 
                completed: false,
                label: 'Application Form',
                required: true
            },
            application_fee: { 
                completed: false,
                label: 'Application Fee Payment',
                required: true
            }
        };

        // Create the application entry
        const insertData = {
            user_id: session.user.id,
            university_name,
            program_name,
            country,
            application_deadline: application_deadline || null,
            application_link: application_link || null,
            notes: notes || null,
            requirements_checklist: defaultRequirements,
            status: 'planning',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('Inserting application data:', insertData);
        
        const { data: application, error: insertError } = await supabase
            .from('applications')
            .insert(insertData)
            .select()
            .single();

        if (insertError) {
            console.error('Error creating application:', insertError);
            return json({ error: 'Failed to create application' }, { status: 500 });
        }

        console.log('✅ Created application:', application.id);
        return json({ 
            success: true, 
            application 
        });

    } catch (error: any) {
        console.error('Error in create application endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}; 