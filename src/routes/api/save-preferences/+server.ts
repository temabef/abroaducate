import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get user session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences) {
      return json({ error: 'Preferences data required' }, { status: 400 });
    }

    const allowedFields = [
      'email_enabled',
      'email_deadlines',
      'scholarship_digest_weekly',
      'scholarship_digest_daily',
      'subscription_alerts',
      // add more if needed
    ];
    const filteredPreferences: Record<string, any> = {};
    for (const key of allowedFields) {
      if (preferences.hasOwnProperty(key)) {
        filteredPreferences[key] = preferences[key];
      }
    }
    // Save preferences to database
    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        ...filteredPreferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error saving preferences:', upsertError);
      return json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    // Log activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          user_id: session.user.id,
          activity_type: 'preferences_updated',
          entity_type: 'settings',
          description: 'Updated email and notification preferences',
          metadata: filteredPreferences // Only log allowed fields
        });
    } catch (activityError) {
      // Don't fail the request if activity logging fails
      console.error('Error logging activity:', activityError);
    }

    return json({ 
      success: true, 
      message: 'Preferences saved successfully' 
    });

  } catch (error) {
    console.error('Error in save-preferences API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 