<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
    
    export let applications: any[] = [];
    export let selectedDate: Date = new Date();
    
    const dispatch = createEventDispatcher();
    
    interface CalendarEvent {
        id: string;
        title: string;
        date: Date;
        type: 'deadline' | 'milestone' | 'reminder';
        priority: 'low' | 'medium' | 'high' | 'urgent';
        applicationId: string;
        universityName: string;
        status: 'upcoming' | 'overdue' | 'completed' | 'today';
    }
    
    let currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let calendarEvents: CalendarEvent[] = [];
    let hoveredDate: Date | null = null;
    let selectedCalendarDate: Date | null = null;
    
    // Generate calendar events from applications
    $: if (applications.length > 0) {
        generateCalendarEvents();
    }
    
    // Generate calendar grid
    $: calendarDays = generateCalendarDays(currentMonth);
    
    function generateCalendarEvents() {
        const events: CalendarEvent[] = [];
        const today = new Date();
        
        applications.forEach(app => {
            if (!app.application_deadline) return;
            
            const deadlineDate = new Date(app.application_deadline);
            
            // Add main deadline
            events.push({
                id: `deadline_${app.id}`,
                title: `${app.university_name} Deadline`,
                date: deadlineDate,
                type: 'deadline',
                priority: getDaysPriority(deadlineDate, today),
                applicationId: app.id,
                universityName: app.university_name,
                status: getEventStatus(deadlineDate, app.status)
            });
            
            // Add preparation milestone (30 days before)
            if (app.status !== 'submitted') {
                const milestoneDate = new Date(deadlineDate);
                milestoneDate.setDate(milestoneDate.getDate() - 30);
                
                if (milestoneDate >= today) {
                    events.push({
                        id: `milestone_${app.id}`,
                        title: `Prepare ${app.university_name}`,
                        date: milestoneDate,
                        type: 'milestone',
                        priority: getDaysPriority(milestoneDate, today),
                        applicationId: app.id,
                        universityName: app.university_name,
                        status: getEventStatus(milestoneDate, 'planning')
                    });
                }
            }
        });
        
        calendarEvents = events;
    }
    
    function generateCalendarDays(month: Date) {
        const start = startOfWeek(startOfMonth(month));
        const end = endOfWeek(endOfMonth(month));
        return eachDayOfInterval({ start, end });
    }
    
    function getDaysPriority(eventDate: Date, today: Date): 'low' | 'medium' | 'high' | 'urgent' {
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'urgent';
        if (diffDays <= 7) return 'urgent';
        if (diffDays <= 14) return 'high';
        if (diffDays <= 30) return 'medium';
        return 'low';
    }
    
    function getEventStatus(eventDate: Date, appStatus?: string): 'upcoming' | 'overdue' | 'completed' | 'today' {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        if (appStatus === 'submitted' || appStatus === 'accepted') return 'completed';
        if (isSameDay(eventDate, today)) return 'today';
        if (eventDate < today) return 'overdue';
        return 'upcoming';
    }
    
    function getEventsForDay(day: Date): CalendarEvent[] {
        return calendarEvents.filter(event => isSameDay(event.date, day));
    }
    
    function getEventColor(event: CalendarEvent): string {
        if (event.status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
        if (event.status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
        if (event.status === 'today') return 'bg-orange-100 text-orange-800 border-orange-200';
        
        if (event.type === 'deadline') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (event.type === 'milestone') return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    function getPriorityDot(priority: string): string {
        const colors = {
            low: 'bg-gray-400',
            medium: 'bg-yellow-400',
            high: 'bg-orange-400',
            urgent: 'bg-red-400'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-400';
    }
    
    function navigateMonth(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            currentMonth = subMonths(currentMonth, 1);
        } else {
            currentMonth = addMonths(currentMonth, 1);
        }
    }
    
    function goToToday() {
        currentMonth = new Date();
        selectedCalendarDate = new Date();
    }
    
    function selectDate(day: Date) {
        selectedCalendarDate = day;
        dispatch('dateSelected', { date: day, events: getEventsForDay(day) });
    }
    
    function getTypeIcon(type: string): string {
        const icons = {
            deadline: '🎯',
            milestone: '📍',
            reminder: '⏰'
        };
        return icons[type as keyof typeof icons] || '📅';
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="calendar-container">
    <!-- Calendar Header -->
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
            <h2 class="text-2xl font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
            </h2>
            
            <div class="flex items-center gap-2">
                <button
                    onclick={() => navigateMonth('prev')}
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                
                <button
                    onclick={() => navigateMonth('next')}
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <button
            onclick={goToToday}
            class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
            Today
        </button>
    </div>
    
    <!-- Calendar Grid -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <!-- Week Days Header -->
        <div class="grid grid-cols-7 border-b bg-gray-50">
            {#each weekDays as day}
                <div class="p-3 text-center text-sm font-medium text-gray-700">
                    {day}
                </div>
            {/each}
        </div>
        
        <!-- Calendar Days -->
        <div class="grid grid-cols-7">
            {#each calendarDays as day}
                {@const dayEvents = getEventsForDay(day)}
                {@const isCurrentMonth = isSameMonth(day, currentMonth)}
                {@const isDayToday = isToday(day)}
                {@const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate)}
                
                <div 
                    class={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer transition-colors ${
                        isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
                    onclick={() => selectDate(day)}
                    onmouseenter={() => hoveredDate = day}
                    onmouseleave={() => hoveredDate = null}
                >
                    <!-- Day Number -->
                    <div class="flex items-center justify-between mb-1">
                        <span class={`text-sm font-medium ${
                            isDayToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' :
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                            {format(day, 'd')}
                        </span>
                        
                        {#if dayEvents.length > 0}
                            <span class="text-xs text-gray-500">
                                {dayEvents.length}
                            </span>
                        {/if}
                    </div>
                    
                    <!-- Events -->
                    <div class="space-y-1">
                        {#each dayEvents.slice(0, 3) as event}
                            <div class={`text-xs px-2 py-1 rounded border ${getEventColor(event)} truncate`}>
                                <div class="flex items-center gap-1">
                                    <div class={`w-1.5 h-1.5 rounded-full ${getPriorityDot(event.priority)}`}></div>
                                    <span class="text-xs">{getTypeIcon(event.type)}</span>
                                    <span class="font-medium truncate">{event.title}</span>
                                </div>
                            </div>
                        {/each}
                        
                        {#if dayEvents.length > 3}
                            <div class="text-xs text-gray-500 pl-2">
                                +{dayEvents.length - 3} more
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    
    <!-- Legend -->
    <div class="mt-6 flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
            <span class="text-gray-700">Deadlines</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
            <span class="text-gray-700">Milestones</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
            <span class="text-gray-700">Completed</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
            <span class="text-gray-700">Overdue</span>
        </div>
    </div>
    
    <!-- Selected Date Events -->
    {#if selectedCalendarDate}
        {@const selectedEvents = getEventsForDay(selectedCalendarDate)}
        <div class="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Events for {format(selectedCalendarDate, 'MMMM d, yyyy')}
            </h3>
            
            {#if selectedEvents.length === 0}
                <p class="text-gray-500">No events scheduled for this day</p>
            {:else}
                <div class="space-y-3">
                    {#each selectedEvents as event}
                        <div class={`p-3 rounded-lg border ${getEventColor(event)}`}>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">{getTypeIcon(event.type)}</span>
                                    <div>
                                        <h4 class="font-medium">{event.title}</h4>
                                        <p class="text-sm opacity-80">{event.universityName}</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <div class={`w-2 h-2 rounded-full ${getPriorityDot(event.priority)}`}></div>
                                    <span class="text-xs font-medium uppercase">{event.priority}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .calendar-container {
        max-width: 100%;
        overflow-x: auto;
    }
</style>