import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get upcoming deadlines (next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: upcomingDeadlines, error } = await supabase
            .from('applications')
            .select('id, university_name, program_name, application_deadline, status, requirements_checklist')
            .eq('user_id', session.user.id)
            .gte('application_deadline', new Date().toISOString().split('T')[0])
            .lte('application_deadline', sevenDaysFromNow.toISOString().split('T')[0])
            .order('application_deadline', { ascending: true });

        if (error) {
            console.error('Error fetching reminders:', error);
            return json({ error: 'Failed to fetch reminders' }, { status: 500 });
        }

        // Calculate missing documents for each application
        const reminders = upcomingDeadlines?.map(app => {
            const checklist = app.requirements_checklist || {};
            const missingDocs = Object.entries(checklist)
                .filter(([_, item]: [string, any]) => !item.completed && item.required)
                .map(([key, item]: [string, any]) => ({
                    key,
                    label: item.label || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                }));

            const daysUntilDeadline = Math.ceil(
                (new Date(app.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                ...app,
                missing_documents: missingDocs,
                days_until_deadline: daysUntilDeadline,
                urgency: daysUntilDeadline <= 3 ? 'high' : daysUntilDeadline <= 7 ? 'medium' : 'low'
            };
        }).filter(app => app.missing_documents.length > 0) || [];

        return json({ reminders });

    } catch (error: any) {
        console.error('Error in basic reminders endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { application_id, reminder_type, notes } = await request.json();

        // Create a simple reminder note
        const { data, error } = await supabase
            .from('applications')
            .update({
                notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', application_id)
            .eq('user_id', session.user.id)
            .select()
            .single();

        if (error) {
            console.error('Error creating reminder:', error);
            return json({ error: 'Failed to create reminder' }, { status: 500 });
        }

        return json({ success: true, application: data });

    } catch (error: any) {
        console.error('Error in create reminder endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}; 