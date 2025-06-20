<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    interface Reminder {
        id: string;
        university_name: string;
        program_name: string;
        application_deadline: string;
        missing_documents: Array<{ key: string; label: string }>;
        days_until_deadline: number;
        urgency: 'high' | 'medium' | 'low';
    }

    let reminders: Reminder[] = [];
    let loading = true;

    onMount(async () => {
        await loadReminders();
    });

    async function loadReminders() {
        try {
            const response = await fetch('/api/reminders/basic');
            if (response.ok) {
                const data = await response.json();
                reminders = data.reminders || [];
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        } finally {
            loading = false;
        }
    }

    function getUrgencyColor(urgency: string): string {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    function getUrgencyIcon(urgency: string): string {
        switch (urgency) {
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            case 'low': return 'ℹ️';
            default: return '📋';
        }
    }
</script>

<div class="bg-white rounded-lg shadow-sm border">
    <div class="px-6 py-4 border-b">
        <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🔔 Upcoming Deadlines
            </h3>
            {#if reminders.length > 0}
                <button
                    onclick={() => goto('/applications')}
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    View All →
                </button>
            {/if}
        </div>
    </div>

    <div class="p-6">
        {#if loading}
            <div class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        {:else if reminders.length === 0}
            <div class="text-center py-6">
                <div class="text-4xl mb-2">✅</div>
                <h4 class="text-lg font-medium text-gray-900 mb-1">All caught up!</h4>
                <p class="text-gray-600 text-sm">No urgent deadlines in the next 7 days</p>
            </div>
        {:else}
            <div class="space-y-4">
                {#each reminders.slice(0, 3) as reminder (reminder.id)}
                    <div class="border rounded-lg p-4 {getUrgencyColor(reminder.urgency)}">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-lg">{getUrgencyIcon(reminder.urgency)}</span>
                                    <h4 class="font-medium text-gray-900">
                                        {reminder.university_name}
                                    </h4>
                                </div>
                                <p class="text-sm text-gray-700 mb-2">{reminder.program_name}</p>
                                
                                <div class="text-xs text-gray-600 mb-2">
                                    <strong>Deadline:</strong> {new Date(reminder.application_deadline).toLocaleDateString()} 
                                    ({reminder.days_until_deadline} days left)
                                </div>

                                {#if reminder.missing_documents.length > 0}
                                    <div class="text-xs">
                                        <span class="font-medium text-gray-700">Missing:</span>
                                        {reminder.missing_documents.slice(0, 3).map(doc => doc.label).join(', ')}
                                        {#if reminder.missing_documents.length > 3}
                                            <span class="text-gray-500">+{reminder.missing_documents.length - 3} more</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            
                            <button
                                onclick={() => goto('/applications')}
                                class="ml-4 px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Manage
                            </button>
                        </div>
                    </div>
                {/each}

                {#if reminders.length > 3}
                    <div class="pt-2 border-t">
                        <button
                            onclick={() => goto('/applications')}
                            class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                        >
                            View {reminders.length - 3} more reminders →
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div> 