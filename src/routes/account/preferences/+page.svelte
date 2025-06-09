<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  // import { getSupabase } from '../../../lib/supabase';
  // import EmailAnalytics from '$lib/components/EmailAnalytics.svelte';

  // Use the supabase client and session from the layout
  $: ({ data } = $page);
  $: ({ supabase, session } = data || {});
  
  interface EmailPreferences {
    email_enabled: boolean;
    email_deadlines: boolean;
    email_milestones: boolean;
    email_reminders: boolean;
    email_frequency: 'immediate' | 'daily' | 'weekly';
    reminder_days: number[];
    business_hours_only: boolean;
    timezone: string;
    calendar_enabled: boolean;
    calendar_provider: 'google' | 'outlook' | 'apple';
  }

  interface UserStats {
    activeApplications: number;
    upcomingDeadlines: number;
    emailsSent: number;
    calendarEvents: number;
  }

  let loading = true;
  let saving = false;
  let message = '';
  let messageType: 'success' | 'error' = 'success';
  let testingEmail = false;
  let testEmailResult = '';
  let authChecked = false;
  
  let preferences: EmailPreferences = {
    email_enabled: true,
    email_deadlines: true,
    email_milestones: true,
    email_reminders: true,
    email_frequency: 'daily',
    reminder_days: [30, 14, 7, 3, 1],
    business_hours_only: false,
    timezone: 'UTC',
    calendar_enabled: false,
    calendar_provider: 'google'
  };

  let userStats: UserStats = {
    activeApplications: 0,
    upcomingDeadlines: 0,
    emailsSent: 0,
    calendarEvents: 0
  };

  const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Africa/Cairo',
    'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo'
  ];

  const reminderDayOptions = [30, 21, 14, 7, 3, 1];

  onMount(async () => {
    try {
      console.log('Checking authentication...');
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        session = null;
      } else {
        console.log('Session data:', currentSession);
        session = currentSession;
      }
      
      authChecked = true;
      
      console.log('Loading preferences and stats...');
      // Always try to load, even without session for demo purposes
      await Promise.all([
        loadPreferences(),
        loadUserStats()
      ]);
      
    } catch (error) {
      console.error('Auth mount error:', error);
      authChecked = true;
    } finally {
      loading = false;
    }
  });

  async function loadPreferences() {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        preferences = {
          email_enabled: data.email_enabled ?? true,
          email_deadlines: data.email_deadlines ?? true,
          email_milestones: data.email_milestones ?? true,
          email_reminders: data.email_reminders ?? true,
          email_frequency: data.email_frequency ?? 'daily',
          reminder_days: data.reminder_days ?? [30, 14, 7, 3, 1],
          business_hours_only: data.business_hours_only ?? false,
          timezone: data.timezone ?? 'UTC',
          calendar_enabled: data.calendar_enabled ?? false,
          calendar_provider: data.calendar_provider ?? 'google'
        };
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  }

  async function loadUserStats() {
    if (!session?.user?.id) return;

    try {
      // Get active applications count
      const { data: applications, error: appsError } = await supabase
        .from('user_scholarship_interactions')
        .select('scholarship_id, scholarships!inner(deadline)')
        .eq('user_id', session.user.id)
        .filter('scholarships.deadline', 'gte', new Date().toISOString());

      // Get upcoming deadlines (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const upcomingDeadlines = applications?.filter(app => {
        const deadline = new Date((app.scholarships as any).deadline);
        return deadline <= thirtyDaysFromNow;
      }).length || 0;

      // Get emails sent count
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'sent');

      // Get calendar events count
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      userStats = {
        activeApplications: applications?.length || 0,
        upcomingDeadlines,
        emailsSent: emailLogs?.length || 0,
        calendarEvents: calendarEvents?.length || 0
      };
    } catch (err) {
      console.error('Error loading user stats:', err);
    }
  }

  async function savePreferences() {
    if (!session?.user?.id) return;

    saving = true;
    message = '';

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          email_enabled: preferences.email_enabled,
          email_deadlines: preferences.email_deadlines,
          email_milestones: preferences.email_milestones,
          email_reminders: preferences.email_reminders,
          email_frequency: preferences.email_frequency,
          reminder_days: preferences.reminder_days,
          business_hours_only: preferences.business_hours_only,
          timezone: preferences.timezone,
          calendar_enabled: preferences.calendar_enabled,
          calendar_provider: preferences.calendar_provider,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      message = '✅ Preferences saved successfully!';
      messageType = 'success';
      setTimeout(() => { message = ''; }, 3000);

      // Log activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: session.user.id,
          activity_type: 'preferences_updated',
          entity_type: 'settings',
          description: 'Updated email and notification preferences',
          metadata: {
            email_enabled: preferences.email_enabled,
            email_frequency: preferences.email_frequency,
            calendar_enabled: preferences.calendar_enabled
          }
        });

    } catch (err) {
      console.error('Error saving preferences:', err);
      message = '❌ Failed to save preferences. Please try again.';
      messageType = 'error';
    } finally {
      saving = false;
    }
  }

  async function sendTestEmail() {
    if (!session?.user?.email) {
      testEmailResult = '❌ User email not found';
      return;
    }

    testingEmail = true;
    testEmailResult = '';

    try {
      const response = await fetch('/api/email-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deadline',
          recipients: [session.user.email],
          scholarshipData: {
            title: 'Test Scholarship (Example)',
            provider: 'Abroaducate University',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntil: 7,
            urgency: 'important'
          },
          userPreferences: {
            emailEnabled: preferences.email_enabled,
            frequency: preferences.email_frequency
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        testEmailResult = `✅ Test email sent successfully! Check your inbox.`;
      } else {
        testEmailResult = '❌ Failed to send test email. Please try again.';
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      testEmailResult = '❌ Error sending test email. Please try again.';
    } finally {
      testingEmail = false;
      setTimeout(() => { testEmailResult = ''; }, 5000);
    }
  }

  function toggleReminderDay(day: number) {
    if (preferences.reminder_days.includes(day)) {
      preferences.reminder_days = preferences.reminder_days.filter(d => d !== day);
    } else {
      preferences.reminder_days = [...preferences.reminder_days, day].sort((a, b) => b - a);
    }
  }

  async function connectCalendar(provider: 'google' | 'outlook' | 'apple') {
    if (!session?.user?.id) return;

    saving = true;
    message = '';

    try {
      const response = await fetch('/api/calendar-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          provider: provider
        })
      });

      if (response.ok) {
        const result = await response.json();
        preferences.calendar_provider = provider;
        preferences.calendar_enabled = true;
        
        message = `✅ ${result.message}`;
        messageType = 'success';
        setTimeout(() => { message = ''; }, 4000);
      } else {
        throw new Error('Failed to connect calendar');
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      message = `❌ Failed to connect ${provider} calendar. Please try again.`;
      messageType = 'error';
    } finally {
      saving = false;
    }
  }

  async function disconnectCalendar() {
    if (!session?.user?.id) return;

    saving = true;
    message = '';

    try {
      const response = await fetch('/api/calendar-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect'
        })
      });

      if (response.ok) {
        preferences.calendar_enabled = false;
        preferences.calendar_provider = 'google';
        
        message = '✅ Calendar disconnected successfully!';
        messageType = 'success';
        setTimeout(() => { message = ''; }, 3000);
      } else {
        throw new Error('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      message = '❌ Failed to disconnect calendar. Please try again.';
      messageType = 'error';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Email Preferences - Abroaducate</title>
  <meta name="description" content="Manage your scholarship deadline reminders and notification preferences." />
</svelte:head>

{#if loading}
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading your preferences...</p>
  </div>
{:else}
  <div class="page">
    {#if !session}
      <div class="debug-info" style="background: #fef3cd; padding: 12px; margin: 20px; border-radius: 8px; border: 1px solid #d69e2e;">
        ⚠️ Note: For full functionality, please sign in with Google from the homepage.
      </div>
    {/if}
    <!-- Header -->
    <div class="header">
      <div class="container">
        <div class="header-content">
          <div>
            <h1>📧 Email & Notification Preferences</h1>
            <p>Manage your scholarship deadline reminders and notification settings</p>
          </div>
          <div class="user-info">
            <div class="user-avatar">👤</div>
            <div>
              <div class="user-email">{session.user.email}</div>
              <div class="user-status">Premium Member</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container">
      <div class="content-grid">
        <!-- Settings Panel -->
        <div class="main-panel">
          
          <!-- Email Notifications Section -->
          <div class="section">
            <div class="section-header">
              <h2>📧 Email Notifications</h2>
              <div class="status-badge {preferences.email_enabled ? 'enabled' : 'disabled'}">
                {preferences.email_enabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>

            <!-- Master Toggle -->
            <div class="setting-group">
              <label class="toggle-setting">
                <input 
                  type="checkbox" 
                  bind:checked={preferences.email_enabled}
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                <div class="toggle-content">
                  <strong>Enable Email Notifications</strong>
                  <small>Receive scholarship deadline reminders and updates via email</small>
                </div>
              </label>
            </div>

            {#if preferences.email_enabled}
              <!-- Email Types -->
              <div class="setting-group">
                <h3>Email Types</h3>
                <div class="checkbox-group">
                  <label class="checkbox-setting">
                    <input type="checkbox" bind:checked={preferences.email_deadlines} />
                    <span class="checkbox-label">
                      <strong>Deadline Reminders</strong>
                      <small>Get notified before scholarship application deadlines</small>
                    </span>
                  </label>
                  
                  <label class="checkbox-setting">
                    <input type="checkbox" bind:checked={preferences.email_milestones} />
                    <span class="checkbox-label">
                      <strong>Milestone Updates</strong>
                      <small>Receive updates when you complete application steps</small>
                    </span>
                  </label>
                  
                  <label class="checkbox-setting">
                    <input type="checkbox" bind:checked={preferences.email_reminders} />
                    <span class="checkbox-label">
                      <strong>Custom Reminders</strong>
                      <small>Get notifications for custom reminders you create</small>
                    </span>
                  </label>
                </div>
              </div>

              <!-- Email Frequency -->
              <div class="setting-group">
                <h3>Email Frequency</h3>
                <div class="radio-group">
                  <label class="radio-setting">
                    <input type="radio" bind:group={preferences.email_frequency} value="immediate" />
                    <span class="radio-content">
                      <strong>Immediate</strong>
                      <small>Send emails as soon as reminders are triggered</small>
                    </span>
                  </label>
                  
                  <label class="radio-setting">
                    <input type="radio" bind:group={preferences.email_frequency} value="daily" />
                    <span class="radio-content">
                      <strong>Daily Digest</strong>
                      <small>One email per day with all your reminders (Recommended)</small>
                    </span>
                  </label>
                  
                  <label class="radio-setting">
                    <input type="radio" bind:group={preferences.email_frequency} value="weekly" />
                    <span class="radio-content">
                      <strong>Weekly Summary</strong>
                      <small>One email per week with upcoming deadlines</small>
                    </span>
                  </label>
                </div>
              </div>

              <!-- Reminder Timing -->
              <div class="setting-group">
                <h3>Reminder Timing</h3>
                <p class="setting-description">Select when to receive reminders before deadlines</p>
                <div class="reminder-days">
                  {#each reminderDayOptions as day}
                    <button 
                      type="button"
                      class="day-button {preferences.reminder_days.includes(day) ? 'active' : ''}"
                      on:click={() => toggleReminderDay(day)}
                    >
                      {day === 0 ? 'Day of deadline' : `${day} days before`}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Advanced Settings -->
              <div class="setting-group">
                <h3>Advanced Settings</h3>
                
                <label class="checkbox-setting">
                  <input type="checkbox" bind:checked={preferences.business_hours_only} />
                  <span class="checkbox-label">
                    <strong>Business Hours Only</strong>
                    <small>Only send emails during business hours (9 AM - 6 PM)</small>
                  </span>
                </label>

                <div class="timezone-setting">
                  <label for="timezone">Timezone</label>
                  <select 
                    id="timezone"
                    bind:value={preferences.timezone}
                    class="timezone-select"
                  >
                    {#each timezones as tz}
                      <option value={tz}>{tz}</option>
                    {/each}
                  </select>
                </div>
              </div>
            {/if}
          </div>

          <!-- Calendar Integration Section -->
          <div class="section">
            <div class="section-header">
              <h2>📅 Calendar Integration</h2>
              <div class="status-badge {preferences.calendar_enabled ? 'enabled' : 'disabled'}">
                {preferences.calendar_enabled ? 'CONNECTED' : 'NOT CONNECTED'}
              </div>
            </div>

            <div class="setting-group">
              <label class="toggle-setting">
                <input 
                  type="checkbox" 
                  bind:checked={preferences.calendar_enabled}
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                <div class="toggle-content">
                  <strong>Enable Calendar Sync</strong>
                  <small>Automatically add scholarship deadlines to your calendar</small>
                </div>
              </label>
            </div>

            {#if preferences.calendar_enabled}
              <div class="calendar-providers">
                <h3>Choose Calendar Provider</h3>
                <div class="provider-buttons">
                  <button 
                    class="provider-button {preferences.calendar_provider === 'google' ? 'active' : ''}"
                    on:click={() => connectCalendar('google')}
                  >
                    <div class="provider-icon">📊</div>
                    <span>Google Calendar</span>
                  </button>
                  
                  <button 
                    class="provider-button {preferences.calendar_provider === 'outlook' ? 'active' : ''}"
                    on:click={() => connectCalendar('outlook')}
                  >
                    <div class="provider-icon">📧</div>
                    <span>Outlook Calendar</span>
                  </button>
                  
                  <button 
                    class="provider-button {preferences.calendar_provider === 'apple' ? 'active' : ''}"
                    on:click={() => connectCalendar('apple')}
                  >
                    <div class="provider-icon">🍎</div>
                    <span>Apple Calendar</span>
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <!-- Test Email Section -->
          <div class="section">
            <div class="section-header">
              <h2>🧪 Test Email System</h2>
            </div>
            
            <div class="test-email-panel">
              <p>Send a test email to verify your notification settings are working correctly.</p>
              
              <button 
                class="test-email-button" 
                on:click={sendTestEmail}
                disabled={testingEmail || !preferences.email_enabled}
              >
                {#if testingEmail}
                  <span class="spinner-small"></span>
                  Sending Test Email...
                {:else}
                  🧪 Send Test Email
                {/if}
              </button>
              
              {#if testEmailResult}
                <div class="test-result">{testEmailResult}</div>
              {/if}
            </div>
          </div>

          <!-- Save Section -->
          <div class="save-section">
            <button 
              class="save-button" 
              on:click={savePreferences}
              disabled={saving}
            >
              {#if saving}
                <span class="spinner-small"></span>
                Saving Preferences...
              {:else}
                💾 Save All Preferences
              {/if}
            </button>
            
            {#if message}
              <div class="message {messageType}">{message}</div>
            {/if}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <!-- Email Analytics Component -->
          <!-- <EmailAnalytics /> -->
          
          <!-- Simple Analytics Placeholder -->
          <div class="stats-card">
            <h3>📊 Email Analytics</h3>
            <div class="analytics-preview">
              <div class="metric-item">
                <div class="metric-number">{userStats.emailsSent}</div>
                <div class="metric-label">Emails Sent</div>
              </div>
              <div class="metric-item">
                <div class="metric-number">{userStats.upcomingDeadlines}</div>
                <div class="metric-label">Upcoming Reminders</div>
              </div>
              <div class="analytics-status">
                <div class="status-indicator active"></div>
                <span>Email System: Active</span>
              </div>
              <div class="analytics-status">
                <div class="status-indicator active"></div>
                <span>SendGrid: Connected</span>
              </div>
            </div>
          </div>
          
          <!-- Stats Card -->
          <div class="stats-card">
            <h3>📊 Your Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{userStats.activeApplications}</div>
                <div class="stat-label">Active Applications</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{userStats.upcomingDeadlines}</div>
                <div class="stat-label">Upcoming Deadlines</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{userStats.emailsSent}</div>
                <div class="stat-label">Emails Sent</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{userStats.calendarEvents}</div>
                <div class="stat-label">Calendar Events</div>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="links-card">
            <h3>🔗 Quick Actions</h3>
            <div class="link-buttons">
              <a href="/scholarships/my-applications" class="link-button primary">
                📋 View My Applications
              </a>
              <a href="/scholarships" class="link-button">
                🔍 Browse Scholarships
              </a>
              <a href="/account" class="link-button">
                👤 Account Settings
              </a>
            </div>
          </div>

          <!-- Tips Card -->
          <div class="tips-card">
            <h3>💡 Pro Tips</h3>
            <ul class="tips-list">
              <li>Enable multiple reminder intervals for best results</li>
              <li>Use daily digest to avoid email clutter</li>
              <li>Connect your calendar for visual deadline tracking</li>
              <li>Check your spam folder for email notifications</li>
              <li>Test your email settings after making changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Loading and Error States */
  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff66;
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Layout */
  .page {
    min-height: 100vh;
    background-color: #f8fafc;
    padding-top: 80px; /* Add space for navbar */
  }

  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 32px 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 8px 0;
  }

  .header p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px 16px;
    border-radius: 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .user-email {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .user-status {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 32px;
    padding: 40px 0;
    align-items: start;
  }

  /* Sections */
  .main-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .section-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: #1f2937;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.enabled {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-badge.disabled {
    background-color: #fee2e2;
    color: #991b1b;
  }

  /* Setting Groups */
  .setting-group {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .setting-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .setting-group h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
  }

  .setting-description {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0 0 16px 0;
  }

  /* Toggle Settings */
  .toggle-setting {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    cursor: pointer;
  }

  .toggle-input {
    display: none;
  }

  .toggle-slider {
    width: 48px;
    height: 24px;
    background-color: #d1d5db;
    border-radius: 12px;
    position: relative;
    transition: background-color 0.2s;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .toggle-slider::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-input:checked + .toggle-slider {
    background-color: #2563eb;
  }

  .toggle-input:checked + .toggle-slider::after {
    transform: translateX(24px);
  }

  .toggle-content strong {
    display: block;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .toggle-content small {
    color: #6b7280;
    font-size: 0.9rem;
  }

  /* Checkbox Settings */
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checkbox-setting {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: border-color 0.2s;
  }

  .checkbox-setting:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .checkbox-setting input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #2563eb;
  }

  .checkbox-label strong {
    display: block;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .checkbox-label small {
    color: #6b7280;
    font-size: 0.9rem;
  }

  /* Radio Settings */
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .radio-setting {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .radio-setting:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .radio-setting input[type="radio"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #2563eb;
  }

  .radio-setting input[type="radio"]:checked + .radio-content {
    color: #2563eb;
  }

  .radio-content strong {
    display: block;
    margin-bottom: 4px;
  }

  .radio-content small {
    color: #6b7280;
    font-size: 0.9rem;
  }

  /* Reminder Days */
  .reminder-days {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .day-button {
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .day-button:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .day-button.active {
    border-color: #2563eb;
    background-color: #eff6ff;
    color: #2563eb;
  }

  /* Timezone Setting */
  .timezone-setting {
    margin-top: 16px;
  }

  .timezone-setting label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .timezone-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
  }

  /* Calendar Providers */
  .calendar-providers h3 {
    margin-bottom: 16px;
  }

  .provider-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .provider-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .provider-button:hover {
    border-color: #d1d5db;
  }

  .provider-button.active {
    border-color: #2563eb;
    background-color: #eff6ff;
    color: #2563eb;
  }

  .provider-icon {
    font-size: 24px;
  }

  /* Test Email */
  .test-email-panel {
    text-align: center;
  }

  .test-email-panel p {
    color: #6b7280;
    margin-bottom: 20px;
  }

  .test-email-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background-color: #059669;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 16px;
  }

  .test-email-button:hover:not(:disabled) {
    background-color: #047857;
  }

  .test-email-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .test-result {
    padding: 12px;
    border-radius: 6px;
    font-weight: 500;
    background-color: #f0f9ff;
    color: #1e40af;
  }

  /* Save Section */
  .save-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    text-align: center;
  }

  .save-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 300px;
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .save-button:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  .save-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .message {
    margin-top: 16px;
    padding: 12px;
    border-radius: 8px;
    font-weight: 500;
    text-align: center;
  }

  .message.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .message.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  /* Sidebar */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .stats-card, .links-card, .tips-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .stats-card h3, .links-card h3, .tips-card h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .stat-item {
    text-align: center;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .link-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .link-button {
    display: block;
    padding: 10px 16px;
    background-color: #f3f4f6;
    color: #374151;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    text-align: center;
    transition: background-color 0.2s;
  }

  .link-button:hover {
    background-color: #e5e7eb;
  }

  .link-button.primary {
    background-color: #2563eb;
    color: white;
  }

  .link-button.primary:hover {
    background-color: #1d4ed8;
  }

  .tips-list {
    margin: 0;
    padding-left: 20px;
    color: #6b7280;
  }

  .tips-list li {
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .login-button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 16px;
  }

  .login-button:hover {
    background-color: #1d4ed8;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .header h1 {
      font-size: 2rem;
    }
    
    .header-content {
      flex-direction: column;
      text-align: center;
    }
    
    .reminder-days {
      grid-template-columns: 1fr;
    }
    
    .provider-buttons {
      grid-template-columns: 1fr;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
