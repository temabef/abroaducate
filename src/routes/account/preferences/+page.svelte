<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import EmailStatusWidget from '$lib/components/EmailStatusWidget.svelte';
  import BasicReminders from '$lib/components/BasicReminders.svelte';

  // Use the supabase client and session from the layout
  $: ({ data } = $page);
  $: ({ supabase, session } = data || {});
  $: user = session?.user;
  
  interface EmailPreferences {
    email_enabled: boolean;
    email_deadlines: boolean;
    email_frequency: 'immediate' | 'daily' | 'weekly';
    timezone: string;
    calendar_enabled: boolean;
    calendar_provider: 'google' | 'outlook' | 'apple';
    scholarship_digest: boolean;
    scholarship_frequency: 'weekly' | 'daily';
    subscription_alerts: boolean;
    instant_alerts: boolean;
  }

  let loading = true;
  let saving = false;
  let saveMessage = '';
  let testingEmail = false;
  let testEmailResult = '';
  
  let preferences: EmailPreferences = {
    email_enabled: false,
    email_deadlines: true,
    email_frequency: 'weekly',
    timezone: 'UTC',
    calendar_enabled: false,
    calendar_provider: 'google',
    scholarship_digest: true,
    scholarship_frequency: 'weekly',
    subscription_alerts: true,
    instant_alerts: false
  };

  // Subscription tier checking
  let userTier: 'free' | 'professional' | 'elite' = 'free';

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
          email_frequency: prefsData.email_frequency ?? 'weekly',
          timezone: prefsData.timezone ?? 'UTC',
          calendar_enabled: prefsData.calendar_enabled ?? false,
          calendar_provider: prefsData.calendar_provider ?? 'google',
          scholarship_digest: prefsData.scholarship_digest ?? true,
          scholarship_frequency: prefsData.scholarship_frequency ?? 'weekly',
          subscription_alerts: prefsData.subscription_alerts ?? true,
          instant_alerts: prefsData.instant_alerts ?? false
        };
      } else {
        preferences.email_enabled = userTier !== 'free';
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      // Set safe defaults
      preferences.email_enabled = userTier !== 'free';
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

            <!-- Scholarship Digest (Always Available) -->
            <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-medium text-blue-900">📊 Weekly Scholarship Digest</h3>
                <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">FREE</span>
              </div>
              <p class="text-sm text-blue-800 mb-3">
                Get a weekly summary of new scholarships matching your profile - completely free for all users!
              </p>
              <div class="flex items-center justify-between">
                <span class="text-sm text-blue-700">Weekly scholarship updates</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" bind:checked={preferences.scholarship_digest} />
                  <div class="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-blue-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <!-- Premium Features Section -->
            {#if userTier === 'free'}
              <!-- Free User - Upgrade Benefits Display -->
              <div class="border border-amber-200 rounded-lg p-4 bg-amber-50 mb-6">
                <h3 class="font-medium text-amber-900 mb-3">🚀 Upgrade for Premium Email Features</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center gap-3">
                    <span class="text-amber-600">⏰</span>
                    <span class="text-amber-800"><strong>Application Deadline Reminders:</strong> Never miss a deadline with personalized reminders</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-amber-600">📅</span>
                    <span class="text-amber-800"><strong>Daily Scholarship Updates:</strong> Get fresh opportunities delivered daily</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-amber-600">🔔</span>
                    <span class="text-amber-800"><strong>Subscription Expiry Alerts:</strong> Stay informed about your account status</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-amber-600">⚡</span>
                    <span class="text-amber-800"><strong>Instant Notifications:</strong> (Elite only) Get immediate alerts for urgent deadlines</span>
                  </div>
                </div>
                <div class="mt-4">
                  <a href="/pricing" class="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                    🔒 Upgrade to Academic Professional
                  </a>
                </div>
              </div>
            {:else}
              <!-- Paid Users - Full Email Settings -->
              <div class="space-y-6">
                
                <!-- Application Deadline Reminders -->
                <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-medium text-green-900">⏰ Application Deadline Reminders</h3>
                    <span class="px-2 py-1 bg-green-600 text-white text-xs rounded-full">PREMIUM</span>
                  </div>
                  <p class="text-sm text-green-800 mb-3">
                    Get personalized reminders for your application deadlines - never miss an opportunity!
                  </p>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-green-700">Application deadline alerts</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" bind:checked={preferences.email_deadlines} />
                      <div class="w-11 h-6 bg-green-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-green-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Enhanced Scholarship Frequency -->
                <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-medium text-purple-900">📊 Scholarship Update Frequency</h3>
                    <span class="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">PREMIUM</span>
                  </div>
                  <p class="text-sm text-purple-800 mb-3">
                    Choose how often you want to receive scholarship updates - weekly or daily!
                  </p>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-purple-700">Scholarship frequency</span>
                    <select bind:value={preferences.scholarship_frequency} class="px-3 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>

                <!-- Subscription Alerts -->
                <div class="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-medium text-indigo-900">🔔 Account & Subscription Alerts</h3>
                    <span class="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">PREMIUM</span>
                  </div>
                  <p class="text-sm text-indigo-800 mb-3">
                    Stay informed about subscription renewals, expiry warnings, and account updates.
                  </p>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-indigo-700">Subscription & account notifications</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" bind:checked={preferences.subscription_alerts} />
                      <div class="w-11 h-6 bg-indigo-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-indigo-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Elite Features -->
                {#if userTier === 'elite'}
                  <div class="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="font-medium text-yellow-900">⚡ Instant Deadline Alerts</h3>
                      <span class="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full">ELITE</span>
                    </div>
                    <p class="text-sm text-yellow-800 mb-3">
                      Get immediate notifications for critical deadlines (3 days or less).
                    </p>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-yellow-700">Instant critical deadline alerts</span>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" bind:checked={preferences.instant_alerts} />
                        <div class="w-11 h-6 bg-yellow-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-yellow-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-orange-500"></div>
                      </label>
                    </div>
                  </div>
                {/if}

              </div>
            {/if}
          </div>

          <!-- Save Button -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              on:click={savePreferences}
              disabled={saving}
              class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {#if saving}
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {/if}
              📤 Save All Preferences
            </button>
            
            {#if saveMessage}
              <div class="mt-4 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
                {saveMessage}
              </div>
            {/if}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Email Status Widget -->
          <EmailStatusWidget userTier={userTier} />
          
          <!-- Basic Reminders Widget -->
          <BasicReminders userTier={userTier} />

          <!-- Test Email Section -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="font-medium text-gray-900 mb-4">🧪 Test Your Email Setup</h3>
            <p class="text-sm text-gray-600 mb-4">
              Send a test email to verify your notification settings are working correctly.
            </p>
            
            <div class="space-y-4">
              <div>
                <label for="testEmail" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="testEmail"
                  value={user?.email || ''}
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              
              <button
                on:click={sendTestEmail}
                disabled={testingEmail}
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {#if testingEmail}
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </div>
                {:else}
                  📤 Send Test Email
                {/if}
              </button>
              
              {#if testEmailResult}
                <div class="text-sm {testEmailResult.includes('Error') ? 'text-red-600' : 'text-green-600'} font-medium">
                  {testEmailResult}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if} 