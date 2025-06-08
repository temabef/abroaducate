import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const userId = session.user.id;
        const type = url.searchParams.get('type') || 'all';
        const status = url.searchParams.get('status') || 'active';
        
        // Get reminders from database
        let query = supabase
            .from('reminders')
            .select('*')
            .eq('user_id', userId)
            .eq('status', status)
            .order('reminder_date', { ascending: true });
            
        if (type !== 'all') {
            query = query.eq('type', type);
        }
        
        const { data: reminders, error } = await query;
        
        if (error) {
            console.error('Error fetching reminders:', error);
            return json({ error: 'Failed to fetch reminders' }, { status: 500 });
        }
        
        // Get applications for timeline generation
        const { data: applications, error: appsError } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', userId);
            
        if (appsError) {
            console.error('Error fetching applications:', appsError);
            return json({ error: 'Failed to fetch applications' }, { status: 500 });
        }
        
        // Generate automatic reminders for deadlines
        const autoReminders = generateAutomaticReminders(applications || []);
        
        return json({
            success: true,
            reminders: reminders || [],
            autoReminders,
            applications: applications || []
        });
        
    } catch (error) {
        console.error('Error in reminders API:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const userId = session.user.id;
        const {
            type,
            title,
            message,
            reminder_date,
            application_id,
            event_id,
            recurring,
            priority
        } = await request.json();
        
        // Insert new reminder
        const { data: reminder, error } = await supabase
            .from('reminders')
            .insert({
                user_id: userId,
                type: type || 'custom',
                title,
                message,
                reminder_date,
                application_id,
                event_id,
                recurring: recurring || false,
                priority: priority || 'medium',
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating reminder:', error);
            return json({ error: 'Failed to create reminder' }, { status: 500 });
        }
        
        return json({
            success: true,
            reminder
        });
        
    } catch (error) {
        console.error('Error in reminder creation:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const { id, status, snoozed_until } = await request.json();
        
        const updateData: any = { status };
        if (snoozed_until) {
            updateData.snoozed_until = snoozed_until;
        }
        
        const { data: reminder, error } = await supabase
            .from('reminders')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating reminder:', error);
            return json({ error: 'Failed to update reminder' }, { status: 500 });
        }
        
        return json({
            success: true,
            reminder
        });
        
    } catch (error) {
        console.error('Error in reminder update:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ url, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const userId = session.user.id;
        const reminderId = url.searchParams.get('id');
        
        if (!reminderId) {
            return json({ error: 'Reminder ID is required' }, { status: 400 });
        }
        
        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', reminderId)
            .eq('user_id', userId);
            
        if (error) {
            console.error('Error deleting reminder:', error);
            return json({ error: 'Failed to delete reminder' }, { status: 500 });
        }
        
        return json({
            success: true,
            message: 'Reminder deleted successfully'
        });
        
    } catch (error) {
        console.error('Error in reminder deletion:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

function generateAutomaticReminders(applications: any[]) {
    const autoReminders: any[] = [];
    const today = new Date();
    
    applications.forEach(app => {
        if (!app.application_deadline || app.status === 'submitted') return;
        
        const deadlineDate = new Date(app.application_deadline);
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Generate reminders for different time intervals
        const reminderIntervals = [
            { days: 30, title: 'One Month Until Deadline', priority: 'medium' },
            { days: 14, title: 'Two Weeks Until Deadline', priority: 'high' },
            { days: 7, title: 'One Week Until Deadline', priority: 'urgent' },
            { days: 3, title: 'Three Days Until Deadline', priority: 'urgent' },
            { days: 1, title: 'One Day Until Deadline', priority: 'urgent' }
        ];
        
        reminderIntervals.forEach(interval => {
            if (daysUntilDeadline === interval.days) {
                autoReminders.push({
                    id: `auto_${app.id}_${interval.days}`,
                    type: 'deadline',
                    title: interval.title,
                    message: `Reminder: ${app.university_name} - ${app.program_name} application deadline is in ${interval.days} day(s)`,
                    reminder_date: new Date().toISOString(),
                    application_id: app.id,
                    priority: interval.priority,
                    status: 'active',
                    auto_generated: true
                });
            }
        });
    });
    
    return autoReminders;
} 