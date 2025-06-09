<script lang="ts">
  import { onMount } from 'svelte';
  import { getScholarshipApplications } from '$lib/services/scholarshipService';
  import type { SupabaseClient } from '@supabase/supabase-js';

  interface Props {
    supabase: SupabaseClient;
    userId: string;
  }

  let { supabase, userId }: Props = $props();

  interface ScholarshipDeadline {
    scholarship_id: string;
    title: string;
    provider: string;
    amount: string;
    deadline: string;
    days_until_deadline: number;
    urgency: 'critical' | 'urgent' | 'important' | 'moderate' | 'low';
    status: string;
    priority: string;
    is_overdue: boolean;
  }

  let applications: ScholarshipDeadline[] = $state([]);
  let isLoading = $state(true);
  let error = $state('');

  // Quick stats
  let stats = $state({
    total: 0,
    urgent: 0,
    overdue: 0,
    due_this_week: 0
  });

  onMount(async () => {
    await loadDeadlines();
  });

  async function loadDeadlines() {
    isLoading = true;
    error = '';

    try {
      const data = await getScholarshipApplications(supabase, userId);
      applications = data
        .filter(app => app.is_saved || app.is_applied)
        .slice(0, 5); // Show top 5 most urgent

      updateStats(data);
    } catch (err) {
      console.error('Error loading deadlines:', err);
      error = 'Failed to load deadlines';
    } finally {
      isLoading = false;
    }
  }

  function updateStats(allApplications: any[]) {
    const active = allApplications.filter(app => app.is_saved || app.is_applied);
    
    stats = {
      total: active.length,
      urgent: active.filter(app => ['critical', 'urgent'].includes(app.urgency)).length,
      overdue: active.filter(app => app.is_overdue).length,
      due_this_week: active.filter(app => app.days_until_deadline <= 7 && app.days_until_deadline >= 0).length
    };
  }

  function getUrgencyColor(urgency: string): string {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      urgent: 'text-orange-600 bg-orange-50 border-orange-200',
      important: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      moderate: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[urgency] || colors.low;
  }

  function formatDeadline(deadline: string, daysUntil: number): string {
    if (daysUntil < 0) return `Overdue (${Math.abs(daysUntil)} days ago)`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `${daysUntil} days left`;
  }

  function getStatusColor(status: string): string {
    const colors = {
      interested: 'bg-blue-100 text-blue-800',
      researching: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-orange-100 text-orange-800',
      applying: 'bg-purple-100 text-purple-800',
      submitted: 'bg-green-100 text-green-800',
      accepted: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
      waitlisted: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">
      📅 Scholarship Deadlines
    </h3>
    <a href="/scholarships/my-applications" class="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
      View All →
    </a>
  </div>

  {#if isLoading}
    <div class="space-y-3">
      {#each Array(3) as _}
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="text-center py-4">
      <p class="text-red-600 text-sm">{error}</p>
      <button onclick={loadDeadlines} class="text-blue-600 hover:text-blue-800 text-sm mt-2 transition">
        Try Again
      </button>
    </div>
  {:else if applications.length === 0}
    <div class="text-center py-6">
      <div class="text-4xl mb-2">🎯</div>
      <p class="text-gray-600 text-sm mb-3">No tracked applications yet</p>
      <a href="/scholarships" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition duration-300">
        Browse Scholarships
      </a>
    </div>
  {:else}
    <!-- Quick Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div class="text-center">
        <div class="text-lg font-bold text-blue-600">{stats.total}</div>
        <div class="text-xs text-gray-600">Tracked</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-bold text-orange-600">{stats.urgent}</div>
        <div class="text-xs text-gray-600">Urgent</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-bold text-red-600">{stats.overdue}</div>
        <div class="text-xs text-gray-600">Overdue</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-bold text-purple-600">{stats.due_this_week}</div>
        <div class="text-xs text-gray-600">This Week</div>
      </div>
    </div>

    <!-- Upcoming Deadlines -->
    <div class="space-y-3">
      {#each applications as application}
        <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition duration-200">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 mb-1">
                <a href="/scholarships/my-applications" class="hover:text-blue-600 transition">
                  {application.title}
                </a>
              </h4>
              <p class="text-xs text-gray-600">{application.provider} • {application.amount}</p>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <span class="px-2 py-1 rounded text-xs border {getUrgencyColor(application.urgency)}">
                {formatDeadline(application.deadline, application.days_until_deadline)}
              </span>
              <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(application.status)}">
                {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Due: {new Date(application.deadline).toLocaleDateString()}</span>
            <span class="capitalize">{application.priority} priority</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Action Buttons -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex space-x-2">
        <a href="/scholarships/my-applications" class="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition duration-300">
          Manage Applications
        </a>
        <a href="/scholarships" class="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition duration-300">
          Find More
        </a>
      </div>
    </div>
  {/if}
</div> 