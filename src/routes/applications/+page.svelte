<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import DocumentChecklist from '$lib/components/DocumentChecklist.svelte';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO } from 'date-fns';

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
    let loading = true;
    let selectedApp: Application | null = null;
    let showCreateModal = false;

    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadApplications();
    });

    async function loadApplications() {
        try {
            const { data: appsData, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', session?.user?.id)
                .order('application_deadline', { ascending: true });

            if (error) {
                console.error('Error loading applications:', error);
            } else {
                applications = appsData || [];
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            loading = false;
        }
    }

    async function handleChecklistUpdate(event: CustomEvent) {
        const { applicationId, checklist } = event.detail;
        
        try {
            const response = await fetch('/api/update-checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    checklist
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update checklist');
            }
            
            await loadApplications();
            
        } catch (error) {
            console.error('Error updating checklist:', error);
        }
    }

    function getStatusColor(status: string): string {
        const colors = {
            planning: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            submitted: 'bg-green-100 text-green-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            waitlisted: 'bg-yellow-100 text-yellow-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    }

    function getDeadlineStatus(deadline: string | null): 'urgent' | 'upcoming' | 'distant' | 'overdue' | 'none' {
        if (!deadline) return 'none';
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 30) return 'upcoming';
        return 'distant';
    }

    function calculateProgress(checklist: any): { completed: number; total: number; percentage: number } {
        if (!checklist) return { completed: 0, total: 16, percentage: 0 };
        
        const items = Object.values(checklist);
        const completed = items.filter((item: any) => 
            item.status === 'completed' || item.status === 'uploaded'
        ).length;
        
        return {
            completed,
            total: items.length || 16,
            percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0
        };
    }
</script>

<svelte:head>
    <title>Applications - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Application Management</h1>
                    <p class="text-gray-600">Track documents and manage your application progress</p>
                </div>
                <div class="flex gap-3">
                    <button
                        onclick={() => goto('/dashboard')}
                        class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onclick={() => showCreateModal = true}
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Application
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if loading}
            <div class="flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        {:else if applications.length === 0}
            <!-- Empty State -->
            <div class="text-center py-20">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p class="text-gray-600 mb-6">Start by creating your first SOP to automatically track applications</p>
                <button
                    onclick={() => goto('/')}
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Create First SOP
                </button>
            </div>
        {:else}
            <!-- Applications Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Applications List -->
                <div class="space-y-6">
                    <h2 class="text-xl font-semibold text-gray-900">Your Applications ({applications.length})</h2>
                    
                    {#each applications as app (app.id)}
                        {@const progress = calculateProgress(app.requirements_checklist)}
                        {@const deadlineStatus = getDeadlineStatus(app.application_deadline)}
                        
                        <div 
                            class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer {selectedApp?.id === app.id ? 'ring-2 ring-blue-500' : ''}"
                            onclick={() => selectedApp = app}
                        >
                            <div class="p-6">
                                <!-- Header -->
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-1">
                                            {app.university_name}
                                        </h3>
                                        <p class="text-gray-600 mb-2">{app.program_name}</p>
                                        
                                        <!-- Deadline -->
                                        {#if app.application_deadline}
                                            <div class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                deadlineStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                                                deadlineStatus === 'urgent' ? 'bg-red-100 text-red-800' :
                                                deadlineStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                🗓️ {formatDistanceToNow(parseISO(app.application_deadline), { addSuffix: true })}
                                            </div>
                                        {/if}
                                    </div>
                                    
                                    <div class="flex flex-col items-end gap-2">
                                        <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                            {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                        <div class="text-right">
                                            <div class="text-sm font-medium text-gray-900">{progress.percentage}%</div>
                                            <div class="text-xs text-gray-500">{progress.completed}/{progress.total}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Progress Bar -->
                                <div class="mb-4">
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style="width: {progress.percentage}%"
                                        ></div>
                                    </div>
                                </div>
                                
                                <!-- Quick Stats -->
                                <div class="flex justify-between text-xs text-gray-500">
                                    <span>Created {formatDistanceToNow(parseISO(app.created_at), { addSuffix: true })}</span>
                                    <span>Click to manage documents</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                
                <!-- Document Management Panel -->
                <div class="lg:sticky lg:top-24">
                    {#if selectedApp}
                        <DocumentChecklist
                            applicationId={selectedApp.id}
                            universityName={selectedApp.university_name}
                            programName={selectedApp.program_name}
                            initialChecklist={selectedApp.requirements_checklist || {}}
                            compact={false}
                            on:checklistUpdated={handleChecklistUpdate}
                        />
                    {:else}
                        <div class="bg-white rounded-lg shadow-sm border p-8 text-center">
                            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Select an Application</h3>
                            <p class="text-gray-600">Choose an application from the list to manage its documents and track progress</p>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div> 