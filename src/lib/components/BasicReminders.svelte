<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface Reminder {
    id: string;
    title: string;
    deadline: string;
    type: 'scholarship' | 'application';
    daysUntil: number;
    urgency: 'critical' | 'urgent' | 'important' | 'moderate';
  }

  let reminders: Reminder[] = [];
  let loading = true;
  let userTier = 'free';
  let emailPreferences = {
    email_enabled: true,
    email_deadlines: true,
    email_frequency: 'daily'
  };

  onMount(async () => {
    await loadReminders();
  });

  async function loadReminders() {
    try {
      const { data: session } = await $page.data.supabase.auth.getSession();
      
      if (session?.session?.user) {
        // Load subscription tier
        const { data: subscription } = await $page.data.supabase
          .from('user_subscriptions')
          .select('plan_type')
          .eq('user_id', session.session.user.id)
          .eq('status', 'active')
          .single();

        userTier = subscription?.plan_type || 'free';

        // Load user preferences
        const { data: prefs } = await $page.data.supabase
          .from('user_preferences')
          .select('email_enabled, email_deadlines, email_frequency')
          .eq('user_id', session.session.user.id)
          .single();

        if (prefs) {
          emailPreferences = {
            email_enabled: prefs.email_enabled ?? true,
            email_deadlines: prefs.email_deadlines ?? true,
            email_frequency: prefs.email_frequency ?? 'daily'
          };
        }

        // Load actual reminders from applications and scholarships
        const [applicationsResponse, scholarshipsResponse] = await Promise.all([
          $page.data.supabase
            .from('applications')
            .select('id, application_deadline')
            .eq('user_id', session.session.user.id)
            .not('application_deadline', 'is', null),
          $page.data.supabase
            .from('scholarship_applications')
            .select('scholarship_id')
            .eq('user_id', session.session.user.id)
        ]);

        // Process applications
        const applicationReminders = (applicationsResponse.data || [])
          .map(app => {
            const deadline = new Date(app.application_deadline);
            const now = new Date();
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 30 && daysUntil >= 0) {
              return {
                id: app.id,
                title: `Application Deadline`,
                deadline: app.application_deadline,
                type: 'application' as const,
                daysUntil,
                urgency: daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'urgent' : daysUntil <= 14 ? 'important' : 'moderate' as const
              };
            }
            return null;
          })
          .filter(Boolean) as Reminder[];

        // Process scholarship applications (simplified - no deadline data for now)
        const scholarshipReminders: Reminder[] = [];

        // Combine and sort by urgency
        reminders = [...applicationReminders, ...scholarshipReminders]
          .sort((a, b) => a.daysUntil - b.daysUntil)
          .slice(0, getMaxReminders()); // Show based on user tier and preferences
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      loading = false;
    }
  }

  function getMaxReminders(): number {
    // Configure how many reminders to show based on tier
    switch (userTier) {
      case 'free': return 3; // Show 3 most urgent for free users
      case 'professional': return 8; // Show 8 for professional users
      case 'elite': return 15; // Show up to 15 for elite users
      default: return 3;
    }
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'important': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }

  function getStatusColor() {
    if (!emailPreferences.email_enabled || !emailPreferences.email_deadlines) {
      return 'text-red-600';
    }
    return 'text-green-600';
  }

  function getStatusText() {
    if (!emailPreferences.email_enabled) return 'Disabled';
    if (!emailPreferences.email_deadlines) return 'Deadlines Off';
    return `Active (${emailPreferences.email_frequency})`;
  }

  function getTierDisplayName(tier: string): string {
    const names: { [key: string]: string } = {
      'free': 'Academic Starter',
      'professional': 'Academic Professional', 
      'elite': 'Academic Elite'
    };
    return names[tier] || 'Academic Starter';
  }

  async function toggleEmailNotifications() {
    goto('/account/preferences#email-settings');
  }
</script>

<div class="bg-white rounded-lg shadow-sm border p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-medium text-gray-900 flex items-center gap-2">
      ⏰ Upcoming Reminders
    </h3>
    <button
      onclick={() => goto('/account/preferences#email-settings')}
      class="text-xs text-blue-600 hover:text-blue-800"
    >
      Settings
    </button>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center py-4">
      <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if reminders.length === 0}
    <div class="text-center py-6">
      <div class="text-gray-400 text-2xl mb-2">📅</div>
      <p class="text-sm text-gray-600 mb-3">No upcoming deadlines</p>
      <a href="/scholarships" class="text-xs text-blue-600 hover:text-blue-700">
        Browse Scholarships →
      </a>
    </div>
  {:else}
    <div class="space-y-3">
      <!-- Status Overview -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">Email Status:</span>
        <span class="text-sm font-medium {getStatusColor()}">
          {getStatusText()}
        </span>
      </div>

      <!-- Reminder List -->
      <div class="space-y-2">
        {#each reminders as reminder}
          <div class="p-3 rounded-lg border {getUrgencyColor(reminder.urgency)}">
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm">{reminder.title}</h4>
                <p class="text-xs opacity-75">
                  {reminder.daysUntil === 0 ? 'Due today!' : 
                   reminder.daysUntil === 1 ? 'Due tomorrow' : 
                   `Due in ${reminder.daysUntil} days`}
                </p>
              </div>
              <div class="ml-2">
                <a 
                  href={reminder.type === 'application' ? `/applications/${reminder.id}` : `/scholarships/${reminder.id}`}
                  class="text-xs bg-white hover:bg-gray-50 border rounded px-2 py-1 transition-colors"
                >
                  View →
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Action Buttons -->
      <div class="border-t pt-3 space-y-2">
        <a href="/applications" class="block text-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded py-2 hover:bg-blue-100 transition-colors">
          📋 View All Applications
        </a>
        
        {#if userTier === 'free'}
          <div class="text-xs text-amber-600 text-center">
            🔒 Upgrade for email notifications
          </div>
          <a href="/pricing" class="block text-center text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded py-2 hover:bg-amber-100 transition-colors">
            Upgrade to {getTierDisplayName('professional')} →
          </a>
        {:else if !emailPreferences.email_enabled || !emailPreferences.email_deadlines}
          <button
            onclick={toggleEmailNotifications}
            class="w-full text-xs bg-green-50 text-green-700 border border-green-200 rounded py-2 hover:bg-green-100 transition-colors"
          >
            Enable Email Reminders
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div> 