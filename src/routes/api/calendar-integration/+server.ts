import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Calendar integration endpoints (Demo version)
const GOOGLE_CALENDAR_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;

// POST: Connect calendar provider
export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, provider } = await request.json();

    if (action === 'connect') {
      // Update existing preferences or create new ones
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      let error;
      if (existingPrefs) {
        // Update existing preferences
        ({ error } = await supabase
          .from('user_preferences')
          .update({
            calendar_enabled: true,
            calendar_provider: provider,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id));
      } else {
        // Insert new preferences
        ({ error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: session.user.id,
            calendar_enabled: true,
            calendar_provider: provider,
            email_enabled: true,
            email_deadlines: true,
            email_milestones: true,
            email_reminders: true,
            email_frequency: 'daily',
            reminder_days: [30, 14, 7, 3, 1],
            business_hours_only: false,
            timezone: 'UTC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
      }

      if (error) throw error;

      // Log activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: session.user.id,
          activity_type: 'calendar_connected',
          entity_type: 'settings',
          description: `Connected ${provider} calendar`,
          metadata: { provider }
        });

      return json({
        success: true,
        message: `${provider} calendar connected successfully! (Demo mode)`,
        provider
      });
    }

    if (action === 'disconnect') {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          calendar_enabled: false,
          calendar_provider: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      return json({
        success: true,
        message: `Calendar disconnected successfully`
      });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in calendar integration:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// GET: Get calendar status
export const GET: RequestHandler = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('calendar_enabled, calendar_provider')
      .eq('user_id', session.user.id)
      .single();

    return json({
      success: true,
      preferences: preferences || {
        calendar_enabled: false,
        calendar_provider: null
      },
      connectionStatus: preferences?.calendar_enabled ? 'connected' : 'not_connected'
    });

  } catch (error) {
    console.error('Error getting calendar status:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 