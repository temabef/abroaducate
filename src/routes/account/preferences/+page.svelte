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
                    <span class="text-amber-800"><strong>Calendar Integration:</strong> Sync deadlines automatically with your personal calendar</span>
                  </div>
                </div>
                <button on:click={() => goto('/pricing')} class="mt-4 w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                  Upgrade to Professional
                </button>
              </div>
            {:else}
              <!-- Premium User - Deadline Reminders -->
              <div class="mb-6">
                <h3 class="font-medium text-gray-900 mb-3">⏰ Application Deadline Reminders</h3>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Receive email alerts for upcoming deadlines</span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" bind:checked={preferences.email_deadlines} />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            {/if}
          </div>

          <!-- Calendar Integration Section -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">🗓️ Calendar Integration</h2>
            {#if userTier === 'free'}
              <div class="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 class="font-medium text-blue-900 mb-2">Sync with your Calendar</h3>
                <p class="text-sm text-blue-800 mb-4">Upgrade to automatically sync application deadlines to your Google, Outlook, or Apple calendar.</p>
                <button on:click={() => goto('/pricing')} class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade to Elite
                </button>
              </div>
            {:else if userTier === 'professional'}
               <div class="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 class="font-medium text-purple-900 mb-2">Upgrade for Calendar Sync</h3>
                <p class="text-sm text-purple-800 mb-4">This is an Elite feature. Upgrade to automatically sync deadlines with your calendar.</p>
                <button on:click={() => goto('/pricing')} class="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  Upgrade to Elite
                </button>
              </div>
            {:else}
              <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-600">Enable calendar integration</span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" bind:checked={preferences.calendar_enabled} />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
              </div>
            {/if}
          </div>
          
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

        <!-- Sidebar (Reminders) -->
        <div class="lg:col-span-1 space-y-6">
          
          <!-- Basic Reminders Widget -->
          <BasicReminders />

        </div>
      </div>
    </div>
  </div>
{/if} 