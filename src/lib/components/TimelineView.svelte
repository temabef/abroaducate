<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { formatDistanceToNow, parseISO, format, differenceInDays, isBefore, isAfter, isEqual } from 'date-fns';
    
    export let applications: any[] = [];
    export let viewMode: 'compact' | 'full' = 'full';
    export let showFilters: boolean = true;
    
    const dispatch = createEventDispatcher();
    
    interface TimelineEvent {
        id: string;
        title: string;
        date: string;
        type: 'deadline' | 'milestone' | 'reminder';
        status: 'upcoming' | 'overdue' | 'completed' | 'today';
        priority: 'low' | 'medium' | 'high' | 'urgent';
        applicationId: string;
        universityName: string;
        programName: string;
        notes?: string;
        actionRequired?: boolean;
    }
    
    let timelineEvents: TimelineEvent[] = [];
    let filteredEvents: TimelineEvent[] = [];
    let filterPriority: string = 'all';
    let filterStatus: string = 'all';
    let filterType: string = 'all';
    
    // Generate timeline events from applications
    $: if (applications.length > 0) {
        generateTimelineEvents();
    }
    
    // Filter events
    $: filteredEvents = timelineEvents.filter(event => {
        const matchesPriority = filterPriority === 'all' || event.priority === filterPriority;
        const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
        const matchesType = filterType === 'all' || event.type === filterType;
        
        return matchesPriority && matchesStatus && matchesType;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    function generateTimelineEvents() {
        const events: TimelineEvent[] = [];
        const today = new Date();
        
        applications.forEach(app => {
            if (!app.application_deadline) return;
            
            const deadlineDate = new Date(app.application_deadline);
            const daysUntilDeadline = differenceInDays(deadlineDate, today);
            
            // Add main deadline event
            events.push({
                id: `deadline_${app.id}`,
                title: `Application Deadline`,
                date: app.application_deadline,
                type: 'deadline',
                status: getEventStatus(app.application_deadline, app.status),
                priority: getPriorityFromDays(daysUntilDeadline),
                applicationId: app.id,
                universityName: app.university_name,
                programName: app.program_name,
                notes: app.notes,
                actionRequired: app.status !== 'submitted' && daysUntilDeadline <= 30
            });
            
            // Add milestone events
            if (app.status !== 'submitted') {
                const milestoneDate = new Date(deadlineDate);
                milestoneDate.setDate(milestoneDate.getDate() - 30);
                
                events.push({
                    id: `milestone_${app.id}`,
                    title: `Prepare Application Materials`,
                    date: milestoneDate.toISOString().split('T')[0],
                    type: 'milestone',
                    status: getEventStatus(milestoneDate.toISOString().split('T')[0], 'planning'),
                    priority: getPriorityFromDays(differenceInDays(milestoneDate, today)),
                    applicationId: app.id,
                    universityName: app.university_name,
                    programName: app.program_name,
                    notes: 'Prepare all required documents and essays'
                });
            }
        });
        
        timelineEvents = events;
    }
    
    function getEventStatus(dateString: string, appStatus?: string): 'upcoming' | 'overdue' | 'completed' | 'today' {
        const eventDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        if (appStatus === 'submitted' || appStatus === 'accepted') return 'completed';
        if (isEqual(eventDate, today)) return 'today';
        if (isBefore(eventDate, today)) return 'overdue';
        return 'upcoming';
    }
    
    function getPriorityFromDays(daysUntil: number): 'low' | 'medium' | 'high' | 'urgent' {
        if (daysUntil < 0) return 'urgent';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 14) return 'high';
        if (daysUntil <= 30) return 'medium';
        return 'low';
    }
    
    function getStatusColor(status: string): string {
        const colors = {
            upcoming: 'border-blue-200 bg-blue-50',
            today: 'border-orange-200 bg-orange-50',
            overdue: 'border-red-200 bg-red-50',
            completed: 'border-green-200 bg-green-50'
        };
        return colors[status as keyof typeof colors] || 'border-gray-200 bg-gray-50';
    }
    
    function getStatusTextColor(status: string): string {
        const colors = {
            upcoming: 'text-blue-800',
            today: 'text-orange-800',
            overdue: 'text-red-800',
            completed: 'text-green-800'
        };
        return colors[status as keyof typeof colors] || 'text-gray-800';
    }
    
    function getPriorityColor(priority: string): string {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    }
    
    function getTypeIcon(type: string): string {
        const icons = {
            deadline: '🎯',
            milestone: '📍',
            reminder: '⏰'
        };
        return icons[type as keyof typeof icons] || '📅';
    }
    
    function markEventCompleted(eventId: string) {
        timelineEvents = timelineEvents.map(event => 
            event.id === eventId 
                ? { ...event, status: 'completed' as const }
                : event
        );
        
        dispatch('eventUpdated', { eventId, status: 'completed' });
    }
    
    function formatEventDate(dateString: string): string {
        const date = parseISO(dateString);
        return format(date, 'MMM d, yyyy');
    }
    
    function getRelativeTime(dateString: string): string {
        return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    }
    
    // Statistics
    $: stats = {
        total: filteredEvents.length,
        urgent: filteredEvents.filter(e => e.priority === 'urgent').length,
        overdue: filteredEvents.filter(e => e.status === 'overdue').length,
        today: filteredEvents.filter(e => e.status === 'today').length
    };
</script>

<div class="timeline-container">
    <!-- Header Section -->
    <div class="mb-6">
        <div class="flex justify-between items-start mb-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">Application Timeline</h2>
                <p class="text-gray-600">Track deadlines, milestones, and important dates</p>
            </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div class="text-sm text-blue-600">Total Events</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div class="text-sm text-red-600">Urgent</div>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">{stats.today}</div>
                <div class="text-sm text-orange-600">Due Today</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">{stats.overdue}</div>
                <div class="text-sm text-purple-600">Overdue</div>
            </div>
        </div>
        
        <!-- Filters -->
        {#if showFilters && viewMode === 'full'}
            <div class="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <label for="timeline-filter-priority" class="text-sm font-medium text-gray-700">Priority:</label>
                    <select id="timeline-filter-priority" bind:value={filterPriority} class="px-3 py-1 border border-gray-300 rounded">
                        <option value="all">All</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                
                <div class="flex items-center gap-2">
                    <label for="timeline-filter-status" class="text-sm font-medium text-gray-700">Status:</label>
                    <select id="timeline-filter-status" bind:value={filterStatus} class="px-3 py-1 border border-gray-300 rounded">
                        <option value="all">All</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="today">Today</option>
                        <option value="overdue">Overdue</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                
                <div class="flex items-center gap-2">
                    <label for="timeline-filter-type" class="text-sm font-medium text-gray-700">Type:</label>
                    <select id="timeline-filter-type" bind:value={filterType} class="px-3 py-1 border border-gray-300 rounded">
                        <option value="all">All</option>
                        <option value="deadline">Deadlines</option>
                        <option value="milestone">Milestones</option>
                        <option value="reminder">Reminders</option>
                    </select>
                </div>
            </div>
        {/if}
    </div>
    
    <!-- Timeline Events -->
    <div class="space-y-4">
        {#if filteredEvents.length === 0}
            <div class="text-center py-12 bg-gray-50 rounded-lg">
                <div class="text-gray-400 text-lg mb-2">📅</div>
                <p class="text-gray-600">No events found for the selected criteria</p>
                <p class="text-sm text-gray-500">Try adjusting your filters or create some applications to see timeline events</p>
            </div>
        {:else}
            {#each filteredEvents as event (event.id)}
                <div class={`border-l-4 pl-6 pb-4 ${getStatusColor(event.status)}`}>
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="text-lg">{getTypeIcon(event.type)}</span>
                                <div>
                                    <h3 class={`font-semibold ${getStatusTextColor(event.status)}`}>
                                        {event.title}
                                    </h3>
                                    <p class="text-sm text-gray-600">
                                        {event.universityName} • {event.programName}
                                    </p>
                                </div>
                                
                                <span class={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                                    {event.priority.toUpperCase()}
                                </span>
                            </div>
                            
                            <div class="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <span>{formatEventDate(event.date)}</span>
                                <span>•</span>
                                <span>{getRelativeTime(event.date)}</span>
                            </div>
                            
                            {#if event.notes}
                                <p class="text-sm text-gray-700 mb-3">{event.notes}</p>
                            {/if}
                            
                            {#if event.actionRequired}
                                <div class="flex items-center gap-2 text-sm">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        ⚠️ Action Required
                                    </span>
                                </div>
                            {/if}
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex items-center gap-2 ml-4">
                            {#if event.status !== 'completed'}
                                <button
                                    onclick={() => markEventCompleted(event.id)}
                                    class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                    Mark Complete
                                </button>
                            {/if}
                            
                            <button
                                onclick={() => dispatch('reminderRequested', { eventId: event.id })}
                                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                                ⏰ Remind
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .timeline-container {
        max-height: 80vh;
        overflow-y: auto;
    }
</style> 
