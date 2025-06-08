import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { applicationId, checklist, sopId } = await request.json();

        if (!applicationId && !sopId) {
            return json({ error: 'Application ID or SOP ID required' }, { status: 400 });
        }

        if (applicationId) {
            // Update existing application
            const { error } = await supabase
                .from('applications')
                .update({
                    requirements_checklist: checklist,
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationId)
                .eq('user_id', session.user.id);

            if (error) {
                console.error('Error updating application checklist:', error);
                return json({ error: 'Failed to update checklist' }, { status: 500 });
            }
        } else if (sopId) {
            // Create or update application linked to SOP
            const { data: sop, error: sopError } = await supabase
                .from('sops')
                .select('university_name, program_name, application_deadline')
                .eq('id', sopId)
                .eq('user_id', session.user.id)
                .single();

            if (sopError) {
                return json({ error: 'SOP not found' }, { status: 404 });
            }

            // Check if application already exists for this SOP
            const { data: existingApp, error: appError } = await supabase
                .from('applications')
                .select('id')
                .eq('sop_id', sopId)
                .eq('user_id', session.user.id)
                .single();

            if (existingApp) {
                // Update existing application
                const { error } = await supabase
                    .from('applications')
                    .update({
                        requirements_checklist: checklist,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingApp.id);

                if (error) {
                    return json({ error: 'Failed to update checklist' }, { status: 500 });
                }
            } else {
                // Create new application
                const { error } = await supabase
                    .from('applications')
                    .insert({
                        user_id: session.user.id,
                        sop_id: sopId,
                        university_name: sop.university_name,
                        program_name: sop.program_name,
                        application_deadline: sop.application_deadline,
                        requirements_checklist: checklist,
                        status: 'planning'
                    });

                if (error) {
                    return json({ error: 'Failed to create application with checklist' }, { status: 500 });
                }
            }
        }

        return json({ success: true });

    } catch (error) {
        console.error('Error updating checklist:', error);
        return json({ error: 'Failed to update checklist' }, { status: 500 });
    }
}; 