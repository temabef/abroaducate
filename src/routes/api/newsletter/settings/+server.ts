import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Create admin client
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SettingsUpdate {
  newsletter_enabled?: boolean;
  scholarship_digest_enabled?: boolean;
  send_frequency?: 'daily' | 'weekly' | 'monthly';
  send_day?: number; // 0-6 (Sunday-Saturday)
  send_time?: string; // HH:MM format
  max_emails_per_batch?: number;
  default_from_name?: string;
}

// Check admin authorization using the same system as admin layout
async function checkAdminAccess(supabaseClient: any): Promise<boolean> {
  try {
    // Check if user can manage content (newsletter is content management)
    const { data: canManageContent, error } = await supabaseClient.rpc('can_manage_content');
    
    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
    
    return !!canManageContent;
  } catch (error) {
    console.error('Error in admin access check:', error);
    return false;
  }
}

// Get a specific setting value
async function getSetting(key: string): Promise<any> {
  const { data } = await supabase
    .from('newsletter_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single();
  
  return data?.setting_value || null;
}

// Update or create a setting
async function updateSetting(key: string, value: any, description?: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_settings')
    .upsert({
      setting_key: key,
      setting_value: value,
      description: description,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    throw new Error(`Failed to update setting ${key}: ${error.message}`);
  }
}

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all newsletter settings
    const { data: settings } = await supabase
      .from('newsletter_settings')
      .select('*')
      .order('setting_key');

    // Transform settings into a more usable format
    const settingsMap: Record<string, any> = {};
    settings?.forEach(setting => {
      settingsMap[setting.setting_key] = setting.setting_value;
    });

    // Get newsletter statistics
    const { data: stats } = await supabase.rpc('get_newsletter_stats');

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('newsletter_email_logs')
      .select('email_type, status, sent_at')
      .order('sent_at', { ascending: false })
      .limit(100);

    // Calculate activity summary
    const activitySummary = {
      today: 0,
      this_week: 0,
      this_month: 0,
      total_sent: 0
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    recentActivity?.forEach(log => {
      if (log.status === 'sent' && log.sent_at) {
        const sentDate = new Date(log.sent_at);
        activitySummary.total_sent++;
        
        if (sentDate >= todayStart) activitySummary.today++;
        if (sentDate >= weekStart) activitySummary.this_week++;
        if (sentDate >= monthStart) activitySummary.this_month++;
      }
    });

    return json({
      success: true,
      settings: settingsMap,
      statistics: stats,
      activity_summary: activitySummary,
      system_status: {
        newsletter_enabled: settingsMap.newsletter_enabled === true,
        digest_enabled: settingsMap.scholarship_digest_enabled === true,
        last_digest_sent: settingsMap.last_digest_sent,
        launch_date: settingsMap.launch_date,
        total_subscribers: stats?.total_subscribers || 0,
        active_subscribers: stats?.active_subscribers || 0
      }
    });

  } catch (error) {
    console.error('Error fetching newsletter settings:', error);
    return json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const updates: SettingsUpdate = await request.json();
    const updatedSettings: string[] = [];

    // Update newsletter enabled status
    if (typeof updates.newsletter_enabled === 'boolean') {
      await updateSetting('newsletter_enabled', updates.newsletter_enabled, 'Master switch for newsletter system');
      updatedSettings.push('newsletter_enabled');
      
      // If enabling for the first time, set launch date
      if (updates.newsletter_enabled) {
        const currentLaunchDate = await getSetting('launch_date');
        if (!currentLaunchDate) {
          await updateSetting('launch_date', new Date().toISOString(), 'When newsletter was first launched');
          updatedSettings.push('launch_date');
        }
      }
    }

    // Update scholarship digest enabled status
    if (typeof updates.scholarship_digest_enabled === 'boolean') {
      await updateSetting('scholarship_digest_enabled', updates.scholarship_digest_enabled, 'Enable weekly scholarship digest for newsletter subscribers');
      updatedSettings.push('scholarship_digest_enabled');
    }

    // Update send frequency
    if (updates.send_frequency && ['daily', 'weekly', 'monthly'].includes(updates.send_frequency)) {
      await updateSetting('send_frequency', updates.send_frequency, 'How often to send newsletter');
      updatedSettings.push('send_frequency');
    }

    // Update send day (0-6, Sunday-Saturday)
    if (typeof updates.send_day === 'number' && updates.send_day >= 0 && updates.send_day <= 6) {
      await updateSetting('send_day', updates.send_day, 'Day of week to send (0=Sunday, 1=Monday, etc.)');
      updatedSettings.push('send_day');
    }

    // Update send time
    if (updates.send_time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updates.send_time)) {
      await updateSetting('send_time', updates.send_time, 'Time to send newsletter (UTC)');
      updatedSettings.push('send_time');
    }

    // Update max emails per batch
    if (typeof updates.max_emails_per_batch === 'number' && updates.max_emails_per_batch > 0 && updates.max_emails_per_batch <= 1000) {
      await updateSetting('max_emails_per_batch', updates.max_emails_per_batch, 'Maximum emails to send per batch');
      updatedSettings.push('max_emails_per_batch');
    }

    // Update default from name
    if (updates.default_from_name && updates.default_from_name.trim().length > 0) {
      await updateSetting('default_from_name', updates.default_from_name.trim(), 'Default sender name');
      updatedSettings.push('default_from_name');
    }

    if (updatedSettings.length === 0) {
      return json({ error: 'No valid settings provided' }, { status: 400 });
    }

    console.log(`✅ Updated newsletter settings: ${updatedSettings.join(', ')}`);

    // Log the settings change
    try {
      await supabase
        .from('newsletter_campaigns')
        .insert({
          campaign_name: 'Settings Update',
          subject_line: `Settings updated: ${updatedSettings.join(', ')}`,
          campaign_type: 'announcement',
          campaign_status: 'sent',
          created_by: session.user.id,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging settings change:', logError);
    }

    return json({
      success: true,
      message: `Successfully updated ${updatedSettings.length} setting(s)`,
      updated_settings: updatedSettings
    });

  } catch (error) {
    console.error('Error updating newsletter settings:', error);
    return json(
      { 
        error: 'Failed to update settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// PUT: Bulk settings update
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'enable_system') {
      // Enable the entire newsletter system
      await updateSetting('newsletter_enabled', true);
      await updateSetting('scholarship_digest_enabled', true);
      
      // Set launch date if not set
      const currentLaunchDate = await getSetting('launch_date');
      if (!currentLaunchDate) {
        await updateSetting('launch_date', new Date().toISOString());
      }

      console.log('🚀 Newsletter system ENABLED');

      return json({
        success: true,
        message: 'Newsletter system has been enabled and is ready to send emails',
        status: 'enabled'
      });

    } else if (action === 'disable_system') {
      // Disable the entire newsletter system
      await updateSetting('newsletter_enabled', false);
      await updateSetting('scholarship_digest_enabled', false);

      console.log('🛑 Newsletter system DISABLED');

      return json({
        success: true,
        message: 'Newsletter system has been disabled - no emails will be sent',
        status: 'disabled'
      });

    } else if (action === 'reset_to_defaults') {
      // Reset all settings to defaults
      const defaultSettings = [
        ['newsletter_enabled', false],
        ['scholarship_digest_enabled', false],
        ['send_frequency', 'weekly'],
        ['send_day', 1], // Monday
        ['send_time', '09:00'],
        ['max_emails_per_batch', 100],
        ['default_from_name', 'Abroaducate Team']
      ];

      for (const [key, value] of defaultSettings) {
        await updateSetting(key, value);
      }

      return json({
        success: true,
        message: 'All settings have been reset to defaults',
        status: 'reset'
      });

    } else {
      return json({ error: 'Invalid action. Use: enable_system, disable_system, or reset_to_defaults' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in bulk settings update:', error);
    return json({ error: 'Failed to update settings' }, { status: 500 });
  }
}; 