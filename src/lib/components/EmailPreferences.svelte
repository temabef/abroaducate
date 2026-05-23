<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '$lib/supabase';

  const supabase = getSupabase();

  interface EmailPreferences {
    email_enabled: boolean;
    email_deadlines: boolean;
    email_milestones: boolean;
    email_reminders: boolean;
    email_frequency: 'immediate' | 'daily' | 'weekly';
    reminder_days: number[];
    business_hours_only: boolean;
    timezone: string;
  }

  let preferences: EmailPreferences = {
    email_enabled: true,
    email_deadlines: true,
    email_milestones: true,
    email_reminders: true,
    email_frequency: 'daily',
    reminder_days: [30, 14, 7, 3, 1],
    business_hours_only: false,
    timezone: 'UTC'
  };

  let loading = true;
  let saving = false;
  let message = '';
  let userId: string | null = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
      await loadPreferences();
    }
    loading = false;
  });

  async function loadPreferences() {
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('email_enabled, email_deadlines, email_milestones, email_reminders, email_frequency, reminder_days, business_hours_only, timezone')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading preferences:', error);
      return;
    }

    if (data) {
      preferences = { ...preferences, ...data };
    }
  }

  async function savePreferences() {
    if (!userId) return;

    saving = true;
    message = '';

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving preferences:', error);
      message = 'Failed to save preferences. Please try again.';
    } else {
      message = 'Preferences saved successfully!';
      setTimeout(() => { message = ''; }, 3000);
    }

    saving = false;
  }

  function toggleReminderDay(day: number) {
    if (preferences.reminder_days.includes(day)) {
      preferences.reminder_days = preferences.reminder_days.filter(d => d !== day);
    } else {
      preferences.reminder_days = [...preferences.reminder_days, day].sort((a, b) => b - a);
    }
  }

  const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
  ];

  const reminderDayOptions = [30, 14, 7, 3, 1, 0];
</script>

<div class="email-preferences-container">
  {#if loading}
    <div class="loading-state">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 mt-2">Loading preferences...</p>
    </div>
  {:else}
    <div class="preferences-form">
      <div class="header">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">📧 Email Preferences</h2>
        <p class="text-gray-600 mb-6">Manage when and how you receive scholarship deadline reminders</p>
      </div>

      <!-- Master Email Toggle -->
      <div class="preference-section">
        <div class="section-header">
          <h3 class="text-lg font-semibold text-gray-800">Email Notifications</h3>
        </div>
        
        <label class="preference-toggle">
          <input 
            type="checkbox" 
            bind:checked={preferences.email_enabled}
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-label">
            <strong>Enable Email Notifications</strong>
            <span class="text-sm text-gray-500">Receive email reminders about scholarship deadlines</span>
          </span>
        </label>
      </div>

      {#if preferences.email_enabled}
        <!-- Email Types -->
        <div class="preference-section">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800">Notification Types</h3>
          </div>

          <div class="preference-group">
            <label class="preference-toggle">
              <input 
                type="checkbox" 
                bind:checked={preferences.email_deadlines}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <strong>Deadline Reminders</strong>
                <span class="text-sm text-gray-500">Get notified about upcoming application deadlines</span>
              </span>
            </label>

            <label class="preference-toggle">
              <input 
                type="checkbox" 
                bind:checked={preferences.email_milestones}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <strong>Milestone Updates</strong>
                <span class="text-sm text-gray-500">Application status changes and important updates</span>
              </span>
            </label>

            <label class="preference-toggle">
              <input 
                type="checkbox" 
                bind:checked={preferences.email_reminders}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <strong>General Reminders</strong>
                <span class="text-sm text-gray-500">Custom reminders and to-do items</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Email Frequency -->
        <div class="preference-section">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800">Email Frequency</h3>
            <p class="text-sm text-gray-600">How often should we send reminder emails?</p>
          </div>

          <div class="frequency-options">
            <label class="radio-option">
              <input 
                type="radio" 
                value="immediate" 
                bind:group={preferences.email_frequency}
                class="radio-input"
              />
              <span class="radio-label">
                <strong>Immediate</strong>
                <span class="text-sm text-gray-500">Send emails as soon as reminders are triggered</span>
              </span>
            </label>

            <label class="radio-option">
              <input 
                type="radio" 
                value="daily" 
                bind:group={preferences.email_frequency}
                class="radio-input"
              />
              <span class="radio-label">
                <strong>Daily Digest</strong>
                <span class="text-sm text-gray-500">One email per day with all reminders</span>
              </span>
            </label>

            <label class="radio-option">
              <input 
                type="radio" 
                value="weekly" 
                bind:group={preferences.email_frequency}
                class="radio-input"
              />
              <span class="radio-label">
                <strong>Weekly Summary</strong>
                <span class="text-sm text-gray-500">One email per week with upcoming deadlines</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Reminder Timing -->
        <div class="preference-section">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800">Reminder Timing</h3>
            <p class="text-sm text-gray-600">When should we remind you before deadlines?</p>
          </div>

          <div class="reminder-days">
            {#each reminderDayOptions as day}
              <label class="day-option">
                <input 
                  type="checkbox" 
                  checked={preferences.reminder_days.includes(day)}
                  onchange={() => toggleReminderDay(day)}
                  class="day-checkbox"
                />
                <span class="day-label">
                  {day === 0 ? 'Day of deadline' : `${day} days before`}
                </span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Additional Settings -->
        <div class="preference-section">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800">Additional Settings</h3>
          </div>

          <div class="preference-group">
            <label class="preference-toggle">
              <input 
                type="checkbox" 
                bind:checked={preferences.business_hours_only}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <strong>Business Hours Only</strong>
                <span class="text-sm text-gray-500">Only send emails during business hours (9 AM - 6 PM)</span>
              </span>
            </label>

            <div class="timezone-selector">
              <label for="email-preferences-timezone" class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select 
                id="email-preferences-timezone"
                bind:value={preferences.timezone}
                class="timezone-select"
              >
                {#each timezones as tz}
                  <option value={tz}>{tz}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/if}

      <!-- Save Button -->
      <div class="save-section">
        <button 
          onclick={savePreferences}
          disabled={saving}
          class="save-button"
        >
          {#if saving}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          {:else}
            💾 Save Preferences
          {/if}
        </button>

        {#if message}
          <p class="message {message.includes('Failed') ? 'error' : 'success'}">
            {message}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .email-preferences-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
  }

  .preferences-form {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .header {
    padding: 24px 24px 0 24px;
  }

  .preference-section {
    padding: 24px;
    border-bottom: 1px solid #f3f4f6;
  }

  .preference-section:last-child {
    border-bottom: none;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .preference-toggle {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .preference-toggle:last-child {
    margin-bottom: 0;
  }

  .toggle-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .toggle-slider {
    flex-shrink: 0;
    width: 44px;
    height: 24px;
    background-color: #d1d5db;
    border-radius: 12px;
    position: relative;
    transition: background-color 0.2s;
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
    transform: translateX(20px);
  }

  .toggle-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .preference-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .frequency-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .radio-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .radio-option:hover {
    border-color: #d1d5db;
  }

  .radio-input:checked + .radio-label {
    color: #2563eb;
  }

  .radio-option:has(.radio-input:checked) {
    border-color: #2563eb;
    background-color: #eff6ff;
  }

  .radio-input {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
  }

  .radio-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .reminder-days {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .day-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .day-option:hover {
    border-color: #d1d5db;
  }

  .day-option:has(.day-checkbox:checked) {
    border-color: #2563eb;
    background-color: #eff6ff;
  }

  .day-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
  }

  .day-label {
    font-size: 14px;
    font-weight: 500;
  }

  .timezone-selector {
    margin-top: 16px;
  }

  .timezone-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
  }

  .save-section {
    padding: 24px;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .save-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
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
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
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

  @media (max-width: 640px) {
    .email-preferences-container {
      padding: 12px;
    }

    .reminder-days {
      grid-template-columns: 1fr;
    }

    .frequency-options {
      gap: 8px;
    }

    .radio-option {
      padding: 8px;
    }
  }
</style> 
