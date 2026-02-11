<script lang="ts">
  import { onMount } from 'svelte';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  interface ScholarshipApplication {
    scholarship_id: string;
    title: string;
    provider: string;
    amount: string;
    deadline: string;
    location: string;
    field: string;
    level: string;
    status: string;
    priority: string;
    days_until_deadline: number;
    urgency: string;
    is_overdue: boolean;
    is_saved: boolean;
    is_applied: boolean;
    notes?: string;
    applied_at?: string;
  }

  // State
  let applications: ScholarshipApplication[] = $state([]);
  let filteredApplications: ScholarshipApplication[] = $state([]);
  let isLoading = $state(true);
  let error = $state('');
  let selectedTab = $state('all');
  let sortBy = $state('deadline');
  let selectedApplication: ScholarshipApplication | null = $state(null);
  let showApplicationDetail = $state(false);
  let showLoginModal = $state(false);
  let bulkWinStrategyLoading = $state(false);
  let bulkWinStrategyMessage = $state<string | null>(null);

  // Statistics
  let stats = $state({
    total: 0,
    interested: 0,
    preparing: 0,
    submitted: 0,
    overdue: 0,
    urgent_deadlines: 0
  });

  // Auth guard - load data only if logged in
  onMount(() => {
    if (session) {
      loadApplications();
    }
  });

  async function loadApplications() {
    if (!session?.user?.id) return;
    
    isLoading = true;
    error = '';

    try {
      console.log('Loading applications for user:', session.user.id);
      
      // Get user interactions first
      const { data: userInteractions, error: interactionsError } = await supabase
        .from('user_scholarship_interactions')
        .select('*')
        .eq('user_id', session.user.id);

      if (interactionsError) {
        console.error('Error loading interactions:', interactionsError);
        error = `Failed to load interactions: ${interactionsError.message}`;
        return;
      }

      console.log('User interactions loaded:', userInteractions?.length || 0);

      if (!userInteractions || userInteractions.length === 0) {
        applications = [];
        updateStatsAndFilter();
        return;
      }

      // Get scholarships for those interactions
      const scholarshipIds = userInteractions.map(i => i.scholarship_id);
      const { data: scholarshipsData, error: scholarshipsError } = await supabase
        .from('scholarships')
        .select('*')
        .in('id', scholarshipIds)
        .eq('is_active', true)
        .order('deadline', { ascending: true });

      if (scholarshipsError) {
        console.error('Error loading scholarships:', scholarshipsError);
        error = `Failed to load scholarships: ${scholarshipsError.message}`;
        return;
      }

      console.log('Scholarships loaded:', scholarshipsData?.length || 0);

      // Combine the data
      const applicationsData = scholarshipsData?.map(scholarship => {
        const interaction = userInteractions.find(i => i.scholarship_id === scholarship.id);
        const deadline = new Date(scholarship.deadline);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
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
          location: scholarship.location,
          field: scholarship.field,
          level: scholarship.level,
          status: interaction?.status || 'interested',
          priority: interaction?.priority || 'medium',
          days_until_deadline: daysUntil,
          urgency,
          is_overdue: daysUntil < 0,
          is_saved: interaction?.is_saved || false,
          is_applied: interaction?.is_applied || false,
          notes: interaction?.notes,
          applied_at: interaction?.applied_at
        };
      }).filter(app => app.is_saved || app.is_applied) || [];

      applications = applicationsData;
      updateStatsAndFilter();
    } catch (err) {
      console.error('Error:', err);
      error = 'Failed to load applications. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function updateStatsAndFilter() {
    // Update stats
    stats = {
      total: applications.length,
      interested: applications.filter(a => a.status === 'interested').length,
      preparing: applications.filter(a => ['researching', 'preparing', 'applying'].includes(a.status)).length,
      submitted: applications.filter(a => ['submitted', 'accepted', 'rejected', 'waitlisted'].includes(a.status)).length,
      overdue: applications.filter(a => a.is_overdue).length,
      urgent_deadlines: applications.filter(a => a.urgency === 'urgent' || a.urgency === 'critical').length
    };

    // Filter applications
    let filtered = [...applications];

    // Apply tab filter
    switch (selectedTab) {
      case 'active':
        filtered = filtered.filter(a => ['interested', 'researching', 'preparing', 'applying'].includes(a.status));
        break;
      case 'submitted':
        filtered = filtered.filter(a => a.status === 'submitted');
        break;
      case 'decided':
        filtered = filtered.filter(a => ['accepted', 'rejected', 'waitlisted'].includes(a.status));
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const urgencyOrder: Record<string, number> = { critical: 4, urgent: 3, important: 2, moderate: 1, low: 0 };
          return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'deadline':
        default:
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });

    filteredApplications = filtered;
  }

  async function updateApplicationStatus(applicationId: string, newStatus: string) {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('user_scholarship_interactions')
      .update({ status: newStatus })
      .eq('user_id', session.user.id)
      .eq('scholarship_id', applicationId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      await loadApplications();
    }
  }

  async function updatePriority(applicationId: string, newPriority: string) {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('user_scholarship_interactions')
      .update({ priority: newPriority })
      .eq('user_id', session.user.id)
      .eq('scholarship_id', applicationId);

    if (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority');
    } else {
      await loadApplications();
    }
  }

  function openApplicationDetail(application: ScholarshipApplication) {
    selectedApplication = application;
    showApplicationDetail = true;
  }

  function closeApplicationDetail() {
    selectedApplication = null;
    showApplicationDetail = false;
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
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

  function getUrgencyColor(urgency: string): string {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      urgent: 'text-orange-600',
      important: 'text-yellow-600',
      moderate: 'text-blue-600',
      low: 'text-gray-600'
    };
    return colors[urgency] || 'text-gray-600';
  }

  function formatDeadline(deadline: string, daysUntil: number): string {
    if (daysUntil < 0) return `Overdue (${Math.abs(daysUntil)} days ago)`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `${daysUntil} days left`;
  }

  async function generateWinStrategiesForSaved() {
    const ids = applications.map((a) => a.scholarship_id).slice(0, 10);
    if (ids.length === 0) return;
    bulkWinStrategyLoading = true;
    bulkWinStrategyMessage = null;
    try {
      const res = await fetch('/api/scholarships/win-strategy/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarship_ids: ids })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data.upgradeRequired) {
          bulkWinStrategyMessage = 'Unlock full plan to generate win strategies in bulk.';
        } else {
          bulkWinStrategyMessage = data.message || data.error || 'Request failed.';
        }
        return;
      }
      const { generated = 0, skipped = 0, failed = 0, limit_reached } = data;
      if (limit_reached) {
        bulkWinStrategyMessage = `Monthly limit reached. Generated: ${generated}, skipped (cached): ${skipped}, failed: ${failed}.`;
      } else {
        bulkWinStrategyMessage = `Done. Generated: ${generated}, skipped (cached): ${skipped}, failed: ${failed}.`;
      }
    } catch (e) {
      bulkWinStrategyMessage = 'Network error. Try again.';
    } finally {
      bulkWinStrategyLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Saved Scholarships - Abroaducate</title>
  <meta name="description" content="Track your scholarship applications and deadlines in one place." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            Saved Scholarships
          </h1>
          <p class="text-xl text-gray-600">
            Track all your scholarship applications, deadlines, and progress in one place.
          </p>
        </div>
        {#if applications.length > 0}
          <div class="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onclick={generateWinStrategiesForSaved}
              disabled={bulkWinStrategyLoading}
              class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 transition disabled:opacity-60"
            >
              {bulkWinStrategyLoading ? 'Generating…' : 'Generate win strategies (up to 10)'}
            </button>
            {#if bulkWinStrategyMessage}
              <p class="text-xs text-gray-600">{bulkWinStrategyMessage}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if !session}
      <!-- Not logged in - Show login prompt -->
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="text-6xl mb-4">🔐</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
        <p class="text-gray-600 mb-6">
          Please log in to access your scholarship applications and track your progress.
        </p>
        <div class="flex justify-center space-x-4">
          <button onclick={() => showLoginModal = true} class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300">
            Log In with Google
          </button>
          <a href="/scholarships" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-300">
            Browse Scholarships
          </a>
        </div>
        <div class="mt-6 text-sm text-gray-500">
          <p>New to Abroaducate? <button onclick={() => showLoginModal = true} class="text-blue-600 hover:text-blue-800 underline">Create account with Google</button></p>
        </div>
      </div>
    {:else if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading your applications...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-red-900 mb-2">Error Loading Applications</h3>
        <p class="text-red-700 mb-4">{error}</p>
        <button onclick={loadApplications} class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300">
          Try Again
        </button>
      </div>
    {:else if applications.length === 0}
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="text-6xl mb-4">📊</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">No Applications Yet</h2>
        <p class="text-gray-600 mb-6">
          Start tracking scholarships by saving or applying to them from the scholarship browse page.
        </p>
        <div class="flex justify-center space-x-4">
          <a href="/scholarships" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300">
            Browse Scholarships
          </a>
          <a href="/dashboard" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-300">
            Go to Dashboard
          </a>
        </div>
      </div>
    {:else}
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div class="text-sm text-gray-600">Total Tracked</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-2xl font-bold text-yellow-600">{stats.preparing}</div>
          <div class="text-sm text-gray-600">In Progress</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-2xl font-bold text-green-600">{stats.submitted}</div>
          <div class="text-sm text-gray-600">Submitted</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div class="text-sm text-gray-600">Overdue</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-2xl font-bold text-orange-600">{stats.urgent_deadlines}</div>
          <div class="text-sm text-gray-600">Urgent</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <button onclick={loadApplications} class="text-blue-600 hover:text-blue-800 transition">
            <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <div class="text-sm text-gray-600">Refresh</div>
          </button>
        </div>
      </div>

      <!-- Filters and Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <!-- Tabs -->
            <div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button 
                onclick={() => {selectedTab = 'all'; updateStatsAndFilter();}}
                class="px-4 py-2 rounded-md text-sm font-medium transition {selectedTab === 'all' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'}"
              >
                All ({applications.length})
              </button>
              <button 
                onclick={() => {selectedTab = 'active'; updateStatsAndFilter();}}
                class="px-4 py-2 rounded-md text-sm font-medium transition {selectedTab === 'active' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'}"
              >
                Active ({stats.preparing + stats.interested})
              </button>
              <button 
                onclick={() => {selectedTab = 'submitted'; updateStatsAndFilter();}}
                class="px-4 py-2 rounded-md text-sm font-medium transition {selectedTab === 'submitted' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'}"
              >
                Submitted ({applications.filter(a => a.status === 'submitted').length})
              </button>
              <button 
                onclick={() => {selectedTab = 'decided'; updateStatsAndFilter();}}
                class="px-4 py-2 rounded-md text-sm font-medium transition {selectedTab === 'decided' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'}"
              >
                Decided ({applications.filter(a => ['accepted', 'rejected', 'waitlisted'].includes(a.status)).length})
              </button>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-4">
              <label for="sort-by" class="text-sm font-medium text-gray-700">Sort by:</label>
              <select id="sort-by" bind:value={sortBy} onchange={() => updateStatsAndFilter()} class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="deadline">Deadline</option>
                <option value="urgency">Urgency</option>
                <option value="status">Status</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Applications List -->
        <div class="divide-y divide-gray-200">
          {#each filteredApplications as application (application.scholarship_id)}
            <div class="p-6 hover:bg-gray-50 transition duration-200">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">
                        <button onclick={() => openApplicationDetail(application)} class="hover:text-blue-600 transition">
                          {application.title}
                        </button>
                      </h3>
                      <p class="text-sm text-gray-600">{application.provider} • {application.amount}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <!-- Status Badge -->
                      <span class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(application.status)}">
                        {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <!-- Priority Badge -->
                      <span class="px-2 py-1 rounded text-xs border {application.priority === 'high' ? 'border-red-200 text-red-700' : application.priority === 'medium' ? 'border-yellow-200 text-yellow-700' : 'border-gray-200 text-gray-700'}">
                        {application.priority} priority
                      </span>
                    </div>
                  </div>

                  <!-- Deadline and Progress -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-4 text-sm">
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span class="{getUrgencyColor(application.urgency)}">
                          {formatDeadline(application.deadline, application.days_until_deadline)}
                        </span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span class="text-gray-600">{application.location}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        <span class="text-gray-600">{application.field}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <select 
                        value={application.status}
                        onchange={(e) => updateApplicationStatus(application.scholarship_id, (e.target as HTMLSelectElement).value)}
                        class="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="interested">Interested</option>
                        <option value="researching">Researching</option>
                        <option value="preparing">Preparing</option>
                        <option value="applying">Applying</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>

                      <select 
                        value={application.priority}
                        onchange={(e) => updatePriority(application.scholarship_id, (e.target as HTMLSelectElement).value)}
                        class="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <button 
                      onclick={() => openApplicationDetail(application)}
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Application Detail Modal -->
    {#if showApplicationDetail && selectedApplication}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold text-gray-900">{selectedApplication.title}</h2>
              <button onclick={closeApplicationDetail} class="text-gray-400 hover:text-gray-600" aria-label="Close application details">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Scholarship Details -->
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Scholarship Details</h3>
                <div class="space-y-3 text-sm">
                  <div><span class="font-medium">Provider:</span> {selectedApplication.provider}</div>
                  <div><span class="font-medium">Amount:</span> {selectedApplication.amount}</div>
                  <div><span class="font-medium">Deadline:</span> {new Date(selectedApplication.deadline).toLocaleDateString()}</div>
                  <div><span class="font-medium">Location:</span> {selectedApplication.location}</div>
                  <div><span class="font-medium">Field:</span> {selectedApplication.field}</div>
                  <div><span class="font-medium">Level:</span> {selectedApplication.level}</div>
                </div>
              </div>

              <!-- Application Status -->
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                <div class="space-y-3">
                  <div class="text-sm">
                    <span class="font-medium">Current Status:</span>
                    <span class="ml-2 px-3 py-1 rounded-full text-xs font-medium {getStatusColor(selectedApplication.status)}">
                      {selectedApplication.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div class="text-sm">
                    <span class="font-medium">Priority:</span>
                    <span class="ml-2 capitalize">{selectedApplication.priority}</span>
                  </div>
                  <div class="text-sm">
                    <span class="font-medium">Time Left:</span>
                    <span class="ml-2 {getUrgencyColor(selectedApplication.urgency)}">
                      {formatDeadline(selectedApplication.deadline, selectedApplication.days_until_deadline)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="mt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                {#if selectedApplication.notes}
                  <p class="text-gray-700">{selectedApplication.notes}</p>
                {:else}
                  <p class="text-gray-500 italic">No notes added yet.</p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Login Modal -->
    <AuthenticationFlow bind:show={showLoginModal} {supabase} mode="login" returnUrl="/scholarships/my-applications" />
  </div>
</div> 