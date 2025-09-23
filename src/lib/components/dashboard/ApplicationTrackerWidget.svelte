<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js';
  import { onMount } from 'svelte';

  let { supabase, session }: { 
    supabase: SupabaseClient, 
    session: any 
  } = $props();

  let loading = $state(true);
  let applicationData = $state<{
    total_applications: number;
    statuses: {
      submitted: number;
      in_review: number;
      interview: number;
      accepted: number;
      rejected: number;
      waitlisted: number;
    };
    upcoming_deadlines: Array<{
      id: string;
      university_name: string;
      program_name: string;
      deadline: string;
      days_left: number;
    }>;
    recent_updates: Array<{
      id: string;
      university_name: string;
      status: string;
      updated_at: string;
    }>;
  }>({
    total_applications: 0,
    statuses: {
      submitted: 0,
      in_review: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      waitlisted: 0
    },
    upcoming_deadlines: [],
    recent_updates: []
  });

  onMount(async () => {
    await loadApplicationData();
  });

  async function loadApplicationData() {
    try {
      loading = true;
      
      // Get application data from the applications table
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('updated_at', { ascending: false });

      if (applications) {
        // Calculate status counts
        const statuses = {
          submitted: 0,
          in_review: 0,
          interview: 0,
          accepted: 0,
          rejected: 0,
          waitlisted: 0
        };

        applications.forEach(app => {
          if (statuses.hasOwnProperty(app.status)) {
            statuses[app.status as keyof typeof statuses]++;
          }
        });

        // Get upcoming deadlines (next 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const upcoming_deadlines = applications
          .filter(app => {
            if (!app.deadline) return false;
            const deadline = new Date(app.deadline);
            return deadline >= now && deadline <= thirtyDaysFromNow;
          })
          .map(app => ({
            id: app.id,
            university_name: app.university_name || 'University',
            program_name: app.program_name || 'Program',
            deadline: app.deadline,
            days_left: Math.ceil((new Date(app.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
          .sort((a, b) => a.days_left - b.days_left)
          .slice(0, 3);

        // Get recent status updates (last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const recent_updates = applications
          .filter(app => new Date(app.updated_at) >= sevenDaysAgo)
          .map(app => ({
            id: app.id,
            university_name: app.university_name || 'University',
            status: app.status,
            updated_at: app.updated_at
          }))
          .slice(0, 3);

        applicationData = {
          total_applications: applications.length,
          statuses,
          upcoming_deadlines,
          recent_updates
        };
      }

    } catch (error) {
      console.error('Error loading application data:', error);
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'waitlisted': return 'text-yellow-600 bg-yellow-100';
      case 'interview': return 'text-purple-600 bg-purple-100';
      case 'in_review': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'in_review': return 'In Review';
      case 'waitlisted': return 'Waitlisted';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  function getDeadlineUrgency(daysLeft: number) {
    if (daysLeft <= 3) return 'text-red-600 bg-red-50 border-red-200';
    if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <!-- Widget Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold text-gray-900">Application Tracker</h3>
        <p class="text-sm text-gray-600">Monitor your application progress</p>
      </div>
    </div>
    <a href="/applications" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
      View All
    </a>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      <span class="ml-2 text-gray-600 text-sm">Loading applications...</span>
    </div>
  {:else}
    <!-- Application Summary -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-700">Applications Overview</h4>
        <span class="text-lg font-semibold text-gray-900">{applicationData.total_applications} Total</span>
      </div>
      
      {#if applicationData.total_applications > 0}
        <div class="grid grid-cols-2 gap-3">
          <div class="flex justify-between items-center p-2 bg-green-50 rounded-lg">
            <span class="text-sm text-green-700">Accepted</span>
            <span class="font-semibold text-green-800">{applicationData.statuses.accepted}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
            <span class="text-sm text-blue-700">In Review</span>
            <span class="font-semibold text-blue-800">{applicationData.statuses.in_review}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
            <span class="text-sm text-purple-700">Interview</span>
            <span class="font-semibold text-purple-800">{applicationData.statuses.interview}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-700">Submitted</span>
            <span class="font-semibold text-gray-800">{applicationData.statuses.submitted}</span>
          </div>
        </div>
      {:else}
        <div class="text-center py-4 bg-gray-50 rounded-lg">
          <p class="text-gray-500 text-sm">No applications tracked yet</p>
        </div>
      {/if}
    </div>

    <!-- Upcoming Deadlines -->
    {#if applicationData.upcoming_deadlines.length > 0}
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
          </svg>
          Upcoming Deadlines
        </h4>
        <div class="space-y-2">
          {#each applicationData.upcoming_deadlines as deadline}
            <div class="border rounded-lg p-3 {getDeadlineUrgency(deadline.days_left)}">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-sm">{deadline.university_name}</p>
                  <p class="text-xs opacity-75">{deadline.program_name}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-sm">
                    {deadline.days_left === 0 ? 'Today' : 
                     deadline.days_left === 1 ? 'Tomorrow' : 
                     `${deadline.days_left} days`}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recent Updates -->
    {#if applicationData.recent_updates.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
          </svg>
          Recent Updates
        </h4>
        <div class="space-y-2">
          {#each applicationData.recent_updates as update}
            <div class="flex justify-between items-center p-2 border border-gray-200 rounded-lg">
              <div>
                <p class="font-medium text-sm">{update.university_name}</p>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(update.status)}">
                  {getStatusLabel(update.status)}
                </span>
              </div>
              <span class="text-xs text-gray-500">{formatTimeAgo(update.updated_at)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Empty State -->
    {#if applicationData.total_applications === 0}
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <h4 class="text-gray-700 font-medium mb-1">No applications yet</h4>
        <p class="text-gray-500 text-sm mb-4">Start tracking your university applications</p>
        <a 
          href="/applications/new"
          class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Add Application
        </a>
      </div>
    {/if}
  {/if}
</div>