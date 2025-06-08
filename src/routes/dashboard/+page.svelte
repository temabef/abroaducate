<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO, isBefore } from 'date-fns';
    import DocumentChecklist from '$lib/components/DocumentChecklist.svelte';
    import TimelineView from '$lib/components/TimelineView.svelte';

    export let data: PageData;
    let { supabase, session } = data;

    type SOP = {
        id: string;
        university_name: string;
        program_name: string;
        country?: string;
        program_type?: string;
        application_deadline: string | null;
        content: string;
        status: 'draft' | 'final' | 'submitted';
        application_submitted: boolean;
        created_at: string;
        updated_at: string;
        word_count: number;
        application_notes?: string;
        submission_date?: string;
        days_until_deadline?: number | null;
        deadline_status?: string;
    };
    
    type Application = {
        id: string;
        university_name: string;
        program_name: string;
        application_deadline: string | null;
        status: 'planning' | 'in_progress' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted';
        sop_id?: string;
        notes?: string;
        submitted_at?: string;
    };
    
    let sops: SOP[] = [];
    let applications: Application[] = [];
    let loading = true;
    let viewMode: 'sops' | 'applications' = 'sops';
    let searchQuery = '';
    let statusFilter: string = 'all';
    let deadlineFilter: string = 'all';
    let countryFilter: string = 'all';
    let programTypeFilter: string = 'all';
    
    // Stats
    let stats = {
        totalSOPs: 0,
        draftSOPs: 0,
        submittedApplications: 0,
        pendingDeadlines: 0
    };

    // Enhanced stats and filtering
    let enhancedStats = {
        finalSOPs: 0,
        overdueDeadlines: 0,
        countriesApplied: 0,
        avgWordCount: 0,
        mostRecentActivity: null
    };
    
    // Available filter options
    let countries: string[] = [];
    let programTypes: string[] = [];

    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadDashboardData();
    });

    async function loadDashboardData() {
        try {
            loading = true;
            
            // Load enhanced dashboard data using the new database function
            const { data: dashboardData, error: dashboardError } = await supabase
                .rpc('get_application_dashboard', { user_uuid: session?.user?.id });
                
            if (dashboardError) {
                console.error('Error loading dashboard data:', dashboardError);
                // Fallback to basic query
                await loadBasicDashboardData();
            } else {
                // Convert to SOP format for compatibility
                sops = dashboardData?.map((item: any) => ({
                    id: item.sop_id,
                    university_name: item.university_name,
                    program_name: item.program_name,
                    country: item.country,
                    program_type: item.program_type,
                    application_deadline: item.application_deadline,
                    status: item.status,
                    word_count: item.word_count,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    days_until_deadline: item.days_until_deadline,
                    deadline_status: item.deadline_status,
                    application_submitted: false,
                    content: '',
                    application_notes: '',
                    submission_date: null
                })) || [];
                
                // Extract filter options
                countries = [...new Set(sops.map(s => s.country).filter((c): c is string => Boolean(c)))];
                programTypes = [...new Set(sops.map(s => s.program_type).filter((p): p is string => Boolean(p)))];
            }
            
            // Load enhanced statistics
            await loadEnhancedStats();
            
            // Load Applications
            const { data: appsData, error: appsError } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', session?.user?.id)
                .order('application_deadline', { ascending: true });
                
            if (appsError) {
                console.error('Error loading applications:', appsError);
            } else {
                applications = appsData || [];
            }
            
            calculateStats();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            loading = false;
        }
    }
    
    async function loadBasicDashboardData() {
        // Fallback method for basic SOP loading
        const { data: sopsData, error: sopsError } = await supabase
            .from('sops')
            .select('*')
            .eq('user_id', session?.user?.id)
            .order('updated_at', { ascending: false });
            
        if (sopsError) {
            console.error('Error loading SOPs:', sopsError);
        } else {
            sops = sopsData || [];
            countries = [...new Set(sops.map(s => s.country).filter((c): c is string => Boolean(c)))];
            programTypes = [...new Set(sops.map(s => s.program_type).filter((p): p is string => Boolean(p)))];
        }
    }
    
    async function loadEnhancedStats() {
        try {
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_user_sop_stats', { user_uuid: session?.user?.id });
                
            if (statsError) {
                console.error('Error loading enhanced stats:', statsError);
            } else if (statsData && statsData.length > 0) {
                const stat = statsData[0];
                enhancedStats = {
                    finalSOPs: stat.final_sops || 0,
                    overdueDeadlines: stat.overdue_deadlines || 0,
                    countriesApplied: stat.countries_applied || 0,
                    avgWordCount: stat.avg_word_count || 0,
                    mostRecentActivity: stat.most_recent_activity
                };
            }
        } catch (error) {
            console.error('Error loading enhanced stats:', error);
        }
    }
    
    function calculateStats() {
        stats.totalSOPs = sops.length;
        stats.draftSOPs = sops.filter(sop => sop.status === 'draft').length;
        stats.submittedApplications = applications.filter(app => app.status === 'submitted').length;
        stats.pendingDeadlines = applications.filter(app => 
            app.application_deadline && 
            isBefore(new Date(), parseISO(app.application_deadline)) &&
            app.status !== 'submitted'
        ).length;
    }
    
    function getDeadlineStatus(deadline: string | null): 'upcoming' | 'overdue' | 'none' {
        if (!deadline) return 'none';
        const deadlineDate = parseISO(deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 30) return 'upcoming';
        return 'none';
    }
    
    function formatDeadline(deadline: string | null): string {
        if (!deadline) return 'No deadline set';
        return formatDistanceToNow(parseISO(deadline), { addSuffix: true });
    }
    
    function getStatusColor(status: string): string {
        const colors = {
            draft: 'bg-yellow-100 text-yellow-800',
            final: 'bg-blue-100 text-blue-800',
            submitted: 'bg-green-100 text-green-800',
            planning: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            waitlisted: 'bg-yellow-100 text-yellow-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    }
    
    function viewSOP(sopId: string) {
        goto(`/sop/${sopId}`);
    }
    
    function editSOP(sopId: string) {
        goto(`/sop/${sopId}/edit`);
    }
    
    function createNewSOP() {
        goto('/#form-section');
    }
    
    async function toggleApplicationStatus(applicationId: string, currentStatus: string) {
        const newStatus = currentStatus === 'submitted' ? 'in_progress' : 'submitted';
        
        const { error } = await supabase
            .from('applications')
            .update({ 
                status: newStatus,
                submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null
            })
            .eq('id', applicationId);
            
        if (!error) {
            await loadDashboardData();
        }
    }

    async function handleChecklistUpdate(event: CustomEvent) {
        const { applicationId, checklist, sopId } = event.detail;
        
        try {
            const response = await fetch('/api/update-checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    sopId,
                    checklist
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update checklist');
            }
            
            // Reload dashboard to reflect changes
            await loadDashboardData();
            
        } catch (error) {
            console.error('Error updating checklist:', error);
            alert('Failed to update checklist. Please try again.');
        }
    }
    
    // Enhanced filter functions
    $: filteredSOPs = sops.filter(sop => {
        const matchesSearch = sop.university_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             sop.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (sop.country && sop.country.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || sop.status === statusFilter;
        const matchesCountry = countryFilter === 'all' || sop.country === countryFilter;
        const matchesProgramType = programTypeFilter === 'all' || sop.program_type === programTypeFilter;
        const matchesDeadline = deadlineFilter === 'all' || 
            (deadlineFilter === 'urgent' && sop.deadline_status === 'urgent') ||
            (deadlineFilter === 'upcoming' && sop.deadline_status === 'upcoming') ||
            (deadlineFilter === 'overdue' && sop.deadline_status === 'overdue') ||
            (deadlineFilter === 'no_deadline' && sop.deadline_status === 'no_deadline');
        
        return matchesSearch && matchesStatus && matchesCountry && matchesProgramType && matchesDeadline;
    });
    
    $: filteredApplications = applications.filter(app => {
        const matchesSearch = app.university_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             app.program_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    function getDeadlineColor(deadlineStatus: string): string {
        const colors = {
            overdue: 'text-red-600 bg-red-50',
            urgent: 'text-orange-600 bg-orange-50',
            upcoming: 'text-yellow-600 bg-yellow-50',
            distant: 'text-green-600 bg-green-50',
            no_deadline: 'text-gray-600 bg-gray-50'
        };
        return colors[deadlineStatus as keyof typeof colors] || 'text-gray-600 bg-gray-50';
    }
    
    function formatDeadlineStatus(deadlineStatus: string, daysUntil: number | null): string {
        if (deadlineStatus === 'no_deadline') return 'No deadline';
        if (deadlineStatus === 'overdue') return `Overdue (${Math.abs(daysUntil || 0)} days ago)`;
        if (daysUntil !== null) {
            if (daysUntil === 0) return 'Due today';
            if (daysUntil === 1) return 'Due tomorrow';
            return `${daysUntil} days left`;
        }
        return deadlineStatus;
    }
</script>

<svelte:head>
    <title>Application Dashboard - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Application Dashboard</h1>
                    <p class="text-gray-600">Manage your SOPs and track your applications</p>
                </div>
                <div class="flex gap-3">
                    <button
                        onclick={() => goto('/applications')}
                        class="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Manage Applications
                    </button>
                    <button
                        onclick={createNewSOP}
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Create New SOP
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    {#if loading}
        <!-- Loading State -->
        <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <!-- Stats Cards -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total SOPs</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.totalSOPs}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Draft SOPs</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.draftSOPs}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Submitted</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.submittedApplications}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <div class="p-2 bg-red-100 rounded-lg">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Pending Deadlines</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.pendingDeadlines}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- View Toggle and Filters -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div class="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onclick={() => viewMode = 'sops'}
                        class={`px-4 py-2 rounded-md font-medium transition-colors ${
                            viewMode === 'sops' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        My SOPs ({sops.length})
                    </button>
                    <button
                        onclick={() => viewMode = 'applications'}
                        class={`px-4 py-2 rounded-md font-medium transition-colors ${
                            viewMode === 'applications' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Applications ({applications.length})
                    </button>
                </div>
                
                <div class="flex gap-4">
                    <!-- Calendar Button -->
                    <button
                        onclick={() => goto('/calendar')}
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                    >
                        📅 Calendar
                    </button>
                    
                    <!-- SOP Review Button -->
                    <button
                        onclick={() => goto('/sop-review')}
                        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        🔍 Review SOP
                    </button>
                    
                    <!-- Cover Letters Button -->
                    <button
                        onclick={() => goto('/cover-letters')}
                        class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium flex items-center gap-2"
                    >
                        📝 Cover Letters
                    </button>
                    
                    <!-- Personal Statements Button -->
                    <button
                        onclick={() => goto('/personal-statements')}
                        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-colors font-medium flex items-center gap-2"
                    >
                        💭 Personal Statements
                    </button>
                    
                    <!-- Academic CV Builder Button -->
                    <button
                        onclick={() => goto('/academic-cv')}
                        class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium flex items-center gap-2"
                    >
                        📄 Academic CV Builder
                    </button>
                    

                    
                    <!-- Applications Button -->
                    <button
                        onclick={() => goto('/applications')}
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Manage Applications
                    </button>
                    
                    <!-- Search -->
                    <div class="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            bind:value={searchQuery}
                            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    
                    <!-- Status Filter -->
                    <select
                        bind:value={statusFilter}
                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        {#if viewMode === 'sops'}
                            <option value="draft">Draft</option>
                            <option value="final">Final</option>
                            <option value="submitted">Submitted</option>
                        {:else}
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="waitlisted">Waitlisted</option>
                        {/if}
                    </select>
                </div>
            </div>
            
            <!-- Content based on view mode -->
            {#if viewMode === 'sops'}
                <!-- SOPs List -->
                {#if filteredSOPs.length === 0}
                    <div class="text-center py-12">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No SOPs found</h3>
                        <p class="text-gray-600 mb-6">Get started by creating your first Statement of Purpose</p>
                        <button
                            onclick={createNewSOP}
                            class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Create Your First SOP
                        </button>
                    </div>
                {:else}
                    <div class="grid gap-6">
                        {#each filteredSOPs as sop (sop.id)}
                            <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                <div class="p-6">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="flex-1">
                                            <h3 class="text-xl font-semibold text-gray-900 mb-2">
                                                {sop.university_name}
                                            </h3>
                                            <p class="text-gray-600 mb-2">{sop.program_name}</p>
                                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                                <span>Created {formatDistanceToNow(parseISO(sop.created_at), { addSuffix: true })}</span>
                                                <span>•</span>
                                                <span>{sop.word_count || 0} words</span>
                                                {#if sop.application_deadline}
                                                    <span>•</span>
                                                    <span class={`font-medium ${
                                                        getDeadlineStatus(sop.application_deadline) === 'overdue' ? 'text-red-600' :
                                                        getDeadlineStatus(sop.application_deadline) === 'upcoming' ? 'text-yellow-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                        Deadline: {formatDeadline(sop.application_deadline)}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sop.status)}`}>
                                                {sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
                                            </span>
                                            {#if sop.application_submitted}
                                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Submitted
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <!-- Document Checklist -->
                                    <div class="mt-4 pt-4 border-t">
                                        <DocumentChecklist
                                            applicationId=""
                                            universityName={sop.university_name}
                                            programName={sop.program_name}
                                            initialChecklist={{}}
                                            compact={true}
                                            on:checklistUpdated={(e) => handleChecklistUpdate({
                                                ...e,
                                                detail: { ...e.detail, sopId: sop.id }
                                            })}
                                        />
                                    </div>
                                    
                                    <div class="flex justify-between items-center pt-4 border-t mt-4">
                                        <div class="flex gap-3">
                                            <button
                                                onclick={() => viewSOP(sop.id)}
                                                class="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                View SOP
                                            </button>
                                            <button
                                                onclick={() => editSOP(sop.id)}
                                                class="text-gray-600 hover:text-gray-700 font-medium"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        
                                        <div class="text-sm text-gray-500">
                                            Last updated {formatDistanceToNow(parseISO(sop.updated_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else}
                <!-- Applications List -->
                {#if filteredApplications.length === 0}
                    <div class="text-center py-12">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No applications tracked</h3>
                        <p class="text-gray-600">Your application tracking will appear here</p>
                    </div>
                {:else}
                    <div class="grid gap-6">
                        {#each filteredApplications as application (application.id)}
                            <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                <div class="p-6">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="flex-1">
                                            <h3 class="text-xl font-semibold text-gray-900 mb-2">
                                                {application.university_name}
                                            </h3>
                                            <p class="text-gray-600 mb-2">{application.program_name}</p>
                                            {#if application.application_deadline}
                                                <p class={`text-sm font-medium ${
                                                    getDeadlineStatus(application.application_deadline) === 'overdue' ? 'text-red-600' :
                                                    getDeadlineStatus(application.application_deadline) === 'upcoming' ? 'text-yellow-600' :
                                                    'text-gray-600'
                                                }`}>
                                                    Deadline: {formatDeadline(application.application_deadline)}
                                                </p>
                                            {/if}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                                {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            <label class="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={application.status === 'submitted'}
                                                    onchange={() => toggleApplicationStatus(application.id, application.status)}
                                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span class="text-sm text-gray-600">Submitted</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {#if application.notes}
                                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <p class="text-sm text-gray-700">{application.notes}</p>
                                        </div>
                                    {/if}
                                    
                                    {#if application.submitted_at}
                                        <div class="text-sm text-gray-500 mb-4">
                                            Submitted {formatDistanceToNow(parseISO(application.submitted_at), { addSuffix: true })}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</div> 