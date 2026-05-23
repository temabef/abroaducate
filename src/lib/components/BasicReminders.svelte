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
    provider?: string; // For scholarships
    amount?: string; // For scholarships
  }

  export let userTier: string = 'free';

  let reminders: Reminder[] = [];
  let loading = true;
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

        // Load reminders from both applications and scholarships
        const [applicationsResponse, scholarshipsResponse] = await Promise.all([
          // Manual applications
          $page.data.supabase
            .from('applications')
            .select('id, application_deadline')
            .eq('user_id', session.session.user.id)
            .not('application_deadline', 'is', null),
          
          // Scholarship deadlines using the dedicated view (with fallback)
          loadScholarshipDeadlines(session.session.user.id)
        ]);

        // Process application reminders
        const applicationReminders = (applicationsResponse.data || [])
          .map((app: { id: string; application_deadline: string }) => {
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

        // Process scholarship reminders (these come pre-calculated from the view)
        const scholarshipReminders = (scholarshipsResponse.data || [])
          .filter((scholarship: any) => scholarship && (scholarship.is_saved || scholarship.is_applied))
          .map((scholarship: any) => scholarship ? ({
            id: scholarship.scholarship_id,
            title: scholarship.title,
            deadline: scholarship.deadline,
            type: 'scholarship' as const,
            daysUntil: scholarship.days_until_deadline,
            urgency: scholarship.urgency as 'critical' | 'urgent' | 'important' | 'moderate',
            provider: scholarship.provider,
            amount: scholarship.amount
          }) : null)
          .filter(Boolean) as Reminder[];

        // Combine and sort by urgency, then by days until deadline
        reminders = [...applicationReminders, ...scholarshipReminders]
          .sort((a, b) => {
            // Sort by urgency first
            const urgencyOrder = { critical: 4, urgent: 3, important: 2, moderate: 1 };
            const urgencyDiff = (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
            if (urgencyDiff !== 0) return urgencyDiff;
            
            // Then by days until deadline
            return a.daysUntil - b.daysUntil;
          })
          .slice(0, getMaxReminders()); // Show based on user tier and preferences

        console.log('Loaded reminders:', {
          applications: applicationReminders.length,
          scholarships: scholarshipReminders.length,
          total: reminders.length
        });
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

  function getReminderDisplayTitle(reminder: Reminder): string {
    if (reminder.type === 'scholarship') {
      return `${reminder.title} (${reminder.provider})`;
    }
    return reminder.title;
  }

  function getReminderViewUrl(reminder: Reminder): string {
    if (reminder.type === 'scholarship') {
      return `/scholarships/my-applications`;
    }
    return `/applications/${reminder.id}`;
  }

  async function loadScholarshipDeadlines(userId: string) {
    try {
      // Try using the optimized view first
      const { data, error } = await $page.data.supabase
        .from('user_scholarship_deadlines')
        .select('scholarship_id, title, provider, amount, deadline, days_until_deadline, urgency, is_saved, is_applied')
        .eq('user_id', userId)
        .gte('days_until_deadline', 0) // Only show non-overdue
        .lte('days_until_deadline', 30) // Only show within 30 days
        .eq('is_overdue', false);

      if (error) {
        console.warn('View query failed, falling back to manual calculation:', error);
        return await loadScholarshipDeadlinesFallback(userId);
      }

      return { data, error: null };
    } catch (error) {
      console.warn('Error loading scholarship deadlines, using fallback:', error);
      return await loadScholarshipDeadlinesFallback(userId);
    }
  }

  async function loadScholarshipDeadlinesFallback(userId: string) {
    try {
      // Fallback: manually join tables and calculate deadlines
      const { data: interactions, error: interactionsError } = await $page.data.supabase
        .from('user_scholarship_interactions')
        .select('scholarship_id, is_saved, is_applied, status, priority')
        .eq('user_id', userId)
        .or('is_saved.eq.true,is_applied.eq.true');

      if (interactionsError || !interactions?.length) {
        return { data: [], error: interactionsError };
      }

      const scholarshipIds = interactions.map((i: any) => i.scholarship_id);
      const { data: scholarships, error: scholarshipsError } = await $page.data.supabase
        .from('scholarships')
        .select('id, title, provider, amount, deadline')
        .in('id', scholarshipIds)
        .eq('is_active', true)
        .gte('deadline', new Date().toISOString().split('T')[0]); // Not overdue

      if (scholarshipsError) {
        return { data: [], error: scholarshipsError };
      }

      // Calculate days until deadline and urgency
      const calculatedData = scholarships?.map((scholarship: any) => {
        const interaction = interactions.find((i: any) => i.scholarship_id === scholarship.id);
        const deadline = new Date(scholarship.deadline);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil > 30) return null; // Filter out deadlines > 30 days

        let urgency = 'low';
        if (daysUntil <= 3) urgency = 'critical';
        else if (daysUntil <= 7) urgency = 'urgent';
        else if (daysUntil <= 14) urgency = 'important';
        else if (daysUntil <= 30) urgency = 'moderate';

        return {
          scholarship_id: scholarship.id,
          title: scholarship.title,
          provider: scholarship.provider,
          amount: scholarship.amount,
          deadline: scholarship.deadline,
          days_until_deadline: daysUntil,
          urgency,
          is_saved: interaction?.is_saved || false,
          is_applied: interaction?.is_applied || false
        };
      }).filter(Boolean) || [];

      return { data: calculatedData, error: null };
    } catch (error) {
      console.error('Fallback scholarship loading failed:', error);
      return { data: [], error };
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm border p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-medium text-gray-900 flex items-center gap-2">
      ⏰ Upcoming Deadlines
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
      <div class="space-y-1">
        <a href="/scholarships" class="block text-xs text-blue-600 hover:text-blue-700">
          Browse Scholarships →
        </a>
        <a href="/applications" class="block text-xs text-green-600 hover:text-green-700">
          Track Applications →
        </a>
      </div>
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
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium px-2 py-1 rounded {reminder.type === 'scholarship' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}">
                    {reminder.type === 'scholarship' ? '🎓 Scholarship' : '📝 Application'}
                  </span>
                </div>
                <h4 class="font-medium text-sm truncate" title={getReminderDisplayTitle(reminder)}>
                  {getReminderDisplayTitle(reminder)}
                </h4>
                {#if reminder.type === 'scholarship' && reminder.amount}
                  <p class="text-xs opacity-75 font-medium">{reminder.amount}</p>
                {/if}
                <p class="text-xs opacity-75">
                  {reminder.daysUntil === 0 ? 'Due today!' : 
                   reminder.daysUntil === 1 ? 'Due tomorrow' : 
                   `Due in ${reminder.daysUntil} days`}
                </p>
              </div>
              <div class="ml-2">
                <a 
                  href={getReminderViewUrl(reminder)}
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
        <div class="grid grid-cols-2 gap-2">
          <a href="/applications" class="text-center text-xs bg-green-50 text-green-700 border border-green-200 rounded py-2 hover:bg-green-100 transition-colors">
            📋 Applications
          </a>
          <a href="/scholarships/my-applications" class="text-center text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded py-2 hover:bg-purple-100 transition-colors">
            🎓 Scholarships
          </a>
        </div>
        
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
