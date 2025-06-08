<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    import TimelineView from '$lib/components/TimelineView.svelte';
    import CalendarView from '$lib/components/CalendarView.svelte';
    
    export let data: PageData;
    let { supabase, session } = data;
    
    type Application = {
        id: string;
        university_name: string;
        program_name: string;
        application_deadline: string | null;
        status: string;
        requirements_checklist: any;
        sop_id: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
    };
    
    let applications: Application[] = [];
    let reminders: any[] = [];
    let loading = true;
    let viewMode: 'timeline' | 'calendar' | 'both' = 'both';
    let selectedDate: Date = new Date();
    let selectedEvents: any[] = [];
    
    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadData();
    });
    
    async function loadData() {
        try {
            // Load applications
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
            
            // Load reminders
            const response = await fetch('/api/reminders');
            if (response.ok) {
                const reminderData = await response.json();
                reminders = [...(reminderData.reminders || []), ...(reminderData.autoReminders || [])];
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            loading = false;
        }
    }
    
    async function handleEventUpdate(event: CustomEvent) {
        const { eventId, status } = event.detail;
        console.log('Event updated:', eventId, status);
        // TODO: Update event status in database
    }
    
    async function handleReminderRequest(event: CustomEvent) {
        const { eventId } = event.detail;
        
        try {
            const response = await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'custom',
                    title: 'Custom Reminder',
                    message: `Reminder for event ${eventId}`,
                    reminder_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
                    event_id: eventId,
                    priority: 'medium'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Reminder created:', data);
                await loadData(); // Reload reminders
            }
        } catch (error) {
            console.error('Error creating reminder:', error);
        }
    }
    
    function handleDateSelected(event: CustomEvent) {
        const { date, events } = event.detail;
        selectedDate = date;
        selectedEvents = events;
    }
    
    function handleViewModeChange(mode: 'timeline' | 'calendar' | 'both') {
        viewMode = mode;
    }
    
    // Calculate quick stats
    $: stats = {
        totalApplications: applications.length,
        upcomingDeadlines: applications.filter(app => {
            if (!app.application_deadline) return false;
            const deadline = new Date(app.application_deadline);
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return deadline >= now && deadline <= thirtyDaysFromNow;
        }).length,
        overdue: applications.filter(app => {
            if (!app.application_deadline) return false;
            const deadline = new Date(app.application_deadline);
            return deadline < new Date() && app.status !== 'submitted';
        }).length,
        activeReminders: reminders.filter(r => r.status === 'active').length
    };
</script>

<svelte:head>
    <title>Calendar & Timeline - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex justify-between items-start">
                <div>
                    <button
                        onclick={() => goto('/dashboard')}
                        class="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 class="text-3xl font-bold text-gray-900">Calendar & Timeline</h1>
                    <p class="text-gray-600">Manage deadlines, milestones, and reminders</p>
                </div>
                
                <!-- View Mode Toggle -->
                <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        class={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                            viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onclick={() => handleViewModeChange('timeline')}
                    >
                        Timeline
                    </button>
                    <button
                        class={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                            viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onclick={() => handleViewModeChange('calendar')}
                    >
                        Calendar
                    </button>
                    <button
                        class={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                            viewMode === 'both' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onclick={() => handleViewModeChange('both')}
                    >
                        Both
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    {#if loading}
        <div class="max-w-7xl mx-auto px-4 py-12">
            <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Loading calendar data...</span>
            </div>
        </div>
    {:else}
        <div class="max-w-7xl mx-auto px-4 py-6">
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Applications</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.upcomingDeadlines}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-2 bg-red-100 rounded-lg">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Overdue</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM8.5 14C7.12 14 6 12.88 6 11.5S7.12 9 8.5 9 11 10.12 11 11.5 9.88 14 8.5 14zM17 8c-1.38 0-2.5-1.12-2.5-2.5S15.62 3 17 3s2.5 1.12 2.5 2.5S18.38 8 17 8z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Active Reminders</p>
                            <p class="text-2xl font-bold text-gray-900">{stats.activeReminders}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            {#if viewMode === 'timeline'}
                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <TimelineView 
                        {applications}
                        viewMode="full"
                        on:eventUpdated={handleEventUpdate}
                        on:reminderRequested={handleReminderRequest}
                    />
                </div>
            {:else if viewMode === 'calendar'}
                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <CalendarView 
                        {applications}
                        {selectedDate}
                        on:dateSelected={handleDateSelected}
                    />
                </div>
            {:else}
                <!-- Both Views -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <!-- Timeline View -->
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Timeline View</h2>
                        <TimelineView 
                            {applications}
                            viewMode="compact"
                            showFilters={false}
                            on:eventUpdated={handleEventUpdate}
                            on:reminderRequested={handleReminderRequest}
                        />
                    </div>
                    
                    <!-- Calendar View -->
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Calendar View</h2>
                        <CalendarView 
                            {applications}
                            {selectedDate}
                            on:dateSelected={handleDateSelected}
                        />
                    </div>
                </div>
            {/if}
            
            <!-- Urgent Reminders Section -->
            {#if reminders.length > 0}
                <div class="mt-8 bg-white rounded-lg shadow-sm border p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        <span class="flex items-center gap-2">
                            ⏰ Urgent Reminders
                            <span class="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                {reminders.filter(r => r.priority === 'urgent').length}
                            </span>
                        </span>
                    </h2>
                    
                    <div class="space-y-3">
                        {#each reminders.slice(0, 5) as reminder}
                            <div class="flex items-center justify-between p-4 border rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class={`w-3 h-3 rounded-full ${
                                        reminder.priority === 'urgent' ? 'bg-red-400' :
                                        reminder.priority === 'high' ? 'bg-orange-400' :
                                        reminder.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                                    }`}></div>
                                    <div>
                                        <h3 class="font-medium text-gray-900">{reminder.title}</h3>
                                        <p class="text-sm text-gray-600">{reminder.message}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                                        reminder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {reminder.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        {/each}
                        
                        {#if reminders.length > 5}
                            <p class="text-sm text-gray-500 text-center">
                                +{reminders.length - 5} more reminders
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>