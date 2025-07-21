<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import EmailStatusWidget from '$lib/components/EmailStatusWidget.svelte';
  import BasicReminders from '$lib/components/BasicReminders.svelte';

  // Use the supabase client and session from the layout
  let data = $derived($page.data);
  let supabase = $derived(data?.supabase);
  let session = $derived(data?.session);
  let user = $derived(session?.user);
  
  interface EmailPreferences {
    email_enabled: boolean;
    email_deadlines: boolean;
    scholarship_digest_weekly: boolean;
    scholarship_digest_daily: boolean;
    timezone: string;
    subscription_alerts: boolean;
    instant_alerts: boolean;
  }

  let loading = $state(true);
  let saving = $state(false);
  let saveMessage = $state('');
  let testingEmail = $state(false);
  let testEmailResult = $state('');
  
  let preferences: EmailPreferences = $state({
    email_enabled: false,
    email_deadlines: true,
    scholarship_digest_weekly: true,
    scholarship_digest_daily: false,
    timezone: 'UTC',
    subscription_alerts: true,
    instant_alerts: false
  });

  // Subscription tier checking
  let userTier: 'free' | 'professional' | 'elite' = $state('free');

  onMount(async () => {
    if (!session?.user?.id) {
      goto('/auth');
      return;
    }
    await loadPreferences();
    loading = false;
  });

  async function loadPreferences() {
    if (!session?.user?.id) return;

    try {
      // Load subscription info
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      userTier = (subscriptionData?.plan_type as 'free' | 'professional' | 'elite') || 'free';

      // Load preferences
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (prefsData) {
        preferences = {
          email_enabled: prefsData.email_enabled ?? (userTier !== 'free'),
          email_deadlines: prefsData.email_deadlines ?? true,
          scholarship_digest_weekly: prefsData.scholarship_digest_weekly ?? true,
          scholarship_digest_daily: userTier !== 'free'
            ? (prefsData.scholarship_digest_daily ?? true)
            : false,
          timezone: prefsData.timezone ?? 'UTC',
          subscription_alerts: prefsData.subscription_alerts ?? true,
          instant_alerts: prefsData.instant_alerts ?? false
        };
      } else {
        preferences.email_enabled = userTier !== 'free';
        preferences.scholarship_digest_weekly = true;
        preferences.scholarship_digest_daily = userTier !== 'free';
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      preferences.email_enabled = userTier !== 'free';
      preferences.scholarship_digest_weekly = true;
      preferences.scholarship_digest_daily = userTier !== 'free';
    }
  }

  async function savePreferences() {
    try {
      saving = true;
      saveMessage = '';
      
      const response = await fetch('/api/save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: preferences
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        saveMessage = 'Preferences saved successfully!';
        setTimeout(() => saveMessage = '', 3000);
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      saveMessage = 'Failed to save preferences. Please try again.';
    } finally {
      saving = false;
    }
  }

  async function sendTestEmail() {
    try {
      testingEmail = true;
      testEmailResult = '';
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          userTier: userTier
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        testEmailResult = 'Test email sent successfully! Check your inbox.';
      } else {
        throw new Error(result.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      testEmailResult = 'Error sending test email. Please try again.';
    } finally {
      testingEmail = false;
    }
  }

  function getTierDisplayName(): string {
    const names: { [key: string]: string } = {
      'free': 'Academic Starter',
      'professional': 'Academic Professional', 
      'elite': 'Academic Elite'
    };
    return names[userTier] || 'Academic Starter';
  }
</script>

<svelte:head>
  <title>Email Preferences - Abroaducate</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-600">Loading preferences...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 pt-8">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">📧 Email & Notification Preferences</h1>
            <p class="text-gray-600">Manage your application deadline reminders and notification settings</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <div class="text-sm text-gray-600">{user?.email}</div>
              <div class="text-sm font-medium text-blue-600">{getTierDisplayName()}</div>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-semibold">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Settings Panel -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Email Notifications Section -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-900">📧 Email Notifications</h2>
              <span class="px-3 py-1 rounded-full text-sm font-medium {preferences.email_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                {preferences.email_enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <!-- Scholarship Digest Section -->
            <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-medium text-blue-900">📊 Scholarship Digest</h3>
                <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {userTier === 'free' ? 'FREE' : 'PREMIUM'}
                </span>
              </div>
              <p class="text-sm text-blue-800 mb-3">
                Get scholarship updates matching your profile.
              </p>
              <div class="space-y-2">
                <!-- Weekly Digest Toggle (all users) -->
                <div class="flex items-center justify-between">
                  <span class="text-sm text-blue-700">Weekly scholarship updates</span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" bind:checked={preferences.scholarship_digest_weekly} on:change={savePreferences} />
                    <div class="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-blue-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {#if userTier !== 'free'}
                  <!-- Daily Digest Toggle (paid users only) -->
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-sm text-blue-700">Daily scholarship updates</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" bind:checked={preferences.scholarship_digest_daily} on:change={savePreferences} />
                      <div class="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-blue-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <!-- Application Deadline Reminders (paid users only, only once) -->
                  <div class="mb-6">
                    <h3 class="font-medium text-gray-900 mb-3">⏰ Application Deadline Reminders</h3>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Receive email alerts for upcoming deadlines</span>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" bind:checked={preferences.email_deadlines} on:change={savePreferences} />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <!-- Subscription Expiry Alerts (paid users only) -->
                  <div class="mb-6">
                    <h3 class="font-medium text-gray-900 mb-3">💳 Subscription Expiry Alerts</h3>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Receive email alerts before your subscription expires</span>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" bind:checked={preferences.subscription_alerts} on:change={savePreferences} />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Sidebar (Reminders) -->
          <div class="lg:col-span-1 space-y-6">
            
            <!-- Basic Reminders Widget -->
            <BasicReminders />

          </div>
        </div>
      </div>
    </div>
  </div>
{/if} 