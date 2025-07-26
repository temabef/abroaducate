import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define schema for validation
const preferencesSchema = z.object({
    preferences: z.object({
        email_enabled: z.boolean().optional(),
        email_deadlines: z.boolean().optional(),
        scholarship_digest_weekly: z.boolean().optional(),
        scholarship_digest_daily: z.boolean().optional(),
        subscription_alerts: z.boolean().optional()
    })
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get user session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestData = await request.json();

    // Validate and sanitize input
    const parsed = preferencesSchema.safeParse(requestData);
    if (!parsed.success) {
      return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    if (!data.preferences) {
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
      if (data.preferences.hasOwnProperty(key)) {
        filteredPreferences[key] = data.preferences[key];
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

    return json({ success: true, message: 'Preferences saved successfully' });

  } catch (error: any) {
    console.error('Error in save preferences:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 