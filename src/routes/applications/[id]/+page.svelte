<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { formatDistanceToNow, parseISO, format } from 'date-fns';

    const { data }: { data: any } = $props();
    let { supabase, session } = $derived(data);

    const applicationId = $page.params.id;

    type ChecklistItem = {
      label: string;
      completed: boolean;
      required_count?: number;
      count?: number;
      notes?: string;
    };

    type Checklist = {
        [key: string]: ChecklistItem;
    };

    type Application = {
        id: string;
        university_name: string;
        program_name: string;
        country: string | null;
        application_deadline: string | null;
        application_link: string | null;
        notes: string | null;
        status: string;
        requirements_checklist: Checklist;
        created_at: string;
        updated_at: string;
        application_fee: number | null;
    };

    let application = $state<Application | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let showEditModal = $state(false);
    let showDeleteConfirm = $state(false);
    let editForm = $state({
        university_name: '',
        program_name: '',
        country: '',
        application_deadline: '',
        application_link: '',
        notes: ''
    });

    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }
        await loadApplication();
    });

    async function loadApplication() {
        try {
            const { data: appData, error: appError } = await supabase
                .from('applications')
                .select('*')
                .eq('id', applicationId)
                .eq('user_id', session?.user?.id)
                .single();

            if (appError) {
                console.error('Error loading application:', appError);
                error = 'Application not found';
            } else {
                application = appData as Application;
            }
        } catch (err: any) {
            console.error('Error:', err);
            error = 'Failed to load application';
        } finally {
            loading = false;
        }
    }

    async function updateStatus(newStatus: string) {
        if (!application) return;
        
        saving = true;
        try {
            const { error: updateError } = await supabase
                .from('applications')
                .update({ 
                    status: newStatus, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('Error updating status:', updateError);
            } else {
                application.status = newStatus;
                application.updated_at = new Date().toISOString();
            }
        } catch (err: any) {
            console.error('Error:', err);
        } finally {
            saving = false;
        }
    }

    async function updateChecklist(itemKey: string, updates: Partial<ChecklistItem>) {
        if (!application) return;
        
        const updatedChecklist = {
            ...application.requirements_checklist,
            [itemKey]: {
                ...application.requirements_checklist[itemKey],
                ...updates
            }
        };

        saving = true;
        try {
            const { error: updateError } = await supabase
                .from('applications')
                .update({ 
                    requirements_checklist: updatedChecklist,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('Error updating checklist:', updateError);
            } else {
                application.requirements_checklist = updatedChecklist;
                application.updated_at = new Date().toISOString();
            }
        } catch (err: any) {
            console.error('Error:', err);
        } finally {
            saving = false;
        }
    }

    function calculateProgress(checklist: Checklist | null): { completed: number; total: number; percentage: number } {
        if (!checklist) return { completed: 0, total: 6, percentage: 0 };
        
        const items = Object.values(checklist);
        const total = items.length;
        
        const completed = items.filter((item: ChecklistItem) => {
            if (item.required_count) {
                return (item.count || 0) >= item.required_count;
            }
            return item.completed === true;
        }).length;
        
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
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

    function openEditModal() {
        if (!application) return;
        editForm = {
            university_name: application.university_name,
            program_name: application.program_name,
            country: application.country || '',
            application_deadline: application.application_deadline || '',
            application_link: application.application_link || '',
            notes: application.notes || ''
        };
        showEditModal = true;
    }

    async function saveEdit() {
        if (!application) return;
        
        saving = true;
        try {
            const { error: updateError } = await supabase
                .from('applications')
                .update({ 
                    university_name: editForm.university_name,
                    program_name: editForm.program_name,
                    country: editForm.country || null,
                    application_deadline: editForm.application_deadline || null,
                    application_link: editForm.application_link || null,
                    notes: editForm.notes || null,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('Error updating application:', updateError);
                error = 'Failed to update application';
            } else {
                // Update local state
                application.university_name = editForm.university_name;
                application.program_name = editForm.program_name;
                application.country = editForm.country || null;
                application.application_deadline = editForm.application_deadline || null;
                application.application_link = editForm.application_link || null;
                application.notes = editForm.notes || null;
                application.updated_at = new Date().toISOString();
                showEditModal = false;
            }
        } catch (err: any) {
            console.error('Error:', err);
            error = 'Failed to update application';
        } finally {
            saving = false;
        }
    }

    async function deleteApplication() {
        if (!application) return;
        
        saving = true;
        try {
            const { error: deleteError } = await supabase
                .from('applications')
                .delete()
                .eq('id', applicationId);

            if (deleteError) {
                console.error('Error deleting application:', deleteError);
                error = 'Failed to delete application';
            } else {
                // Successfully deleted, redirect to applications page
                goto('/applications');
            }
        } catch (err: any) {
            console.error('Error:', err);
            error = 'Failed to delete application';
        } finally {
            saving = false;
            showDeleteConfirm = false;
        }
    }

    const progress = $derived(application ? calculateProgress(application.requirements_checklist) : { completed: 0, total: 6, percentage: 0 });
    const deadlineStatus = $derived(application?.application_deadline ? getDeadlineStatus(application.application_deadline) : 'none');
</script>

<svelte:head>
    <title>{application ? `${application.program_name} at ${application.university_name}` : 'Application Details'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    {:else if error}
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
    {:else if application}
        <div class="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
            
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <a href="/applications" class="text-blue-600 hover:underline text-sm mb-2 inline-block">← Back to all applications</a>
                    <h1 class="text-3xl font-bold text-gray-900">{application.university_name}</h1>
                    <p class="text-xl text-gray-600">{application.program_name}</p>
                    <p class="text-md text-gray-500">{application.country}</p>
                </div>
                <div class="flex items-center gap-2 mt-4 md:mt-0">
                    <button onclick={openEditModal} class="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">Edit</button>
                    <button onclick={() => showDeleteConfirm = true} class="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column: Checklist & Notes -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Requirements Checklist -->
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h2 class="text-xl font-semibold text-gray-800 mb-1">Application Checklist</h2>
                        <p class="text-sm text-gray-500 mb-4">Track your progress for this application.</p>
                        
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-medium text-gray-700">Progress</span>
                                <span class="text-sm font-medium text-blue-700">{progress.percentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div class="bg-blue-600 h-2.5 rounded-full" style="width: {progress.percentage}%"></div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            {#each Object.entries(application.requirements_checklist) as [key, item]}
                                <div class="p-4 rounded-lg {item.completed ? 'bg-green-50' : 'bg-gray-50'} border {item.completed ? 'border-green-200' : 'border-gray-200'}">
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="flex items-center gap-3">
                                            {#if item.required_count}
                                                <!-- Letters of Recommendation with counter -->
                                                <input 
                                                        type="checkbox" 
                                                        class="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        checked={item.completed}
                                                        onchange={(e) => updateChecklist(key, { completed: (e.target as HTMLInputElement).checked })}
                                                />
                                                <div class="flex-grow">
                                                    <div>
                                                        <span class="font-medium text-gray-900">{item.label}</span>
                                                        <div class="text-sm text-gray-600">
                                                            {item.count || 0} collected
                                                            {#if item.completed}
                                                                <span class="text-green-600 font-medium">✓ Sufficient</span>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            {:else}
                                                <!-- Standard checklist item -->
                                                <input 
                                                    type="checkbox" 
                                                    class="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    checked={item.completed}
                                                    onchange={(e) => updateChecklist(key, { completed: (e.target as HTMLInputElement).checked })}
                                                />
                                                <span class="font-medium text-gray-900">{item.label}</span>    
                                            {/if}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            {#if item.completed}
                                                <span class="text-green-600 text-sm">✅ Complete</span>
                                            {:else if item.required_count}
                                                <div class="flex items-center gap-2">
                                                    <button
                                                        onclick={() => updateChecklist(key, { count: Math.max(0, (item.count || 0) - 1) })}
                                                        disabled={saving || (item.count || 0) <= 0}
                                                        class="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        -
                                                    </button>
                                                    <span class="text-sm font-medium w-8 text-center">{item.count || 0}</span>
                                                    <button
                                                        onclick={() => updateChecklist(key, { count: Math.min(item.required_count || 0, (item.count || 0) + 1) })}
                                                        disabled={saving || (item.count || 0) >= item.required_count}
                                                        class="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h2 class="text-xl font-semibold text-gray-800 mb-4">Notes</h2>
                        <textarea 
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            rows="6"
                            placeholder="Add your personal notes, reminders, or contact information here..."
                            value={application.notes || ''}
                            onblur={(e) => updateChecklist('notes', { notes: (e.target as HTMLTextAreaElement).value })}
                            disabled={saving}
                        ></textarea>
                    </div>
                </div>
                
                <!-- Right Column: Details -->
                <div class="space-y-6">
                    <!-- Status -->
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Status</h3>
                        <select
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {getStatusColor(application.status)}"
                            value={application.status}
                            onchange={(e) => updateStatus((e.target as HTMLSelectElement).value)}
                            disabled={saving}
                        >
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="waitlisted">Waitlisted</option>
                        </select>
                    </div>

                    <!-- Key Information -->
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Key Information</h3>
                        <ul class="space-y-3 text-sm">
                            <li class="flex justify-between">
                                <span class="font-medium text-gray-600">Deadline</span>
                                {#if application.application_deadline}
                                    {@const deadlineInfo = getDeadlineStatus(application.application_deadline)}
                                    <span class={`font-bold ${
                                        deadlineInfo === 'urgent' ? 'text-red-600' :
                                        deadlineInfo === 'upcoming' ? 'text-yellow-600' :
                                        deadlineInfo === 'overdue' ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                        {format(parseISO(application.application_deadline), 'MMM d, yyyy')}
                                        {#if deadlineInfo !== 'overdue' && deadlineInfo !== 'none'}
                                            ({formatDistanceToNow(parseISO(application.application_deadline))} left)
                                        {:else if deadlineInfo === 'overdue'}
                                            (Overdue)
                                        {/if}
                                    </span>
                                {:else}
                                    <span class="text-gray-500">Not set</span>
                                {/if}
                            </li>
                            <li class="flex justify-between">
                                <span class="font-medium text-gray-600">Application Fee</span>
                                <span class="text-gray-900">{application.application_fee ? `$${application.application_fee}` : 'Not set'}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="font-medium text-gray-600">Last Updated</span>
                                <span class="text-gray-900">{formatDistanceToNow(parseISO(application.updated_at))} ago</span>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Application Link -->
                    {#if application.application_link}
                        <div class="bg-white p-6 rounded-xl shadow-md">
                             <a 
                                href={application.application_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Go to Application Portal →
                            </a>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Edit Modal -->
{#if showEditModal}
    <div
        class="fixed inset-0 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-application-title"
        onkeydown={(event) => event.key === 'Escape' && (showEditModal = false)}
        tabindex="-1"
    >
        <button
            type="button"
            class="absolute inset-0 bg-black bg-opacity-50"
            onclick={() => showEditModal = false}
            aria-label="Close edit application modal"
        ></button>
        <div class="relative z-10 bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
            <h2 id="edit-application-title" class="text-2xl font-bold mb-6 text-gray-900">Edit Application</h2>
            <form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="space-y-4">
                <div>
                    <label for="university_name" class="block text-sm font-medium text-gray-700">University Name</label>
                    <input type="text" id="university_name" bind:value={editForm.university_name} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="program_name" class="block text-sm font-medium text-gray-700">Program Name</label>
                    <input type="text" id="program_name" bind:value={editForm.program_name} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" id="country" bind:value={editForm.country} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="application_deadline" class="block text-sm font-medium text-gray-700">Application Deadline</label>
                    <input type="date" id="application_deadline" bind:value={editForm.application_deadline} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="application_link" class="block text-sm font-medium text-gray-700">Application Link</label>
                    <input type="url" id="application_link" bind:value={editForm.application_link} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="notes" bind:value={editForm.notes} rows="4" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" onclick={() => showEditModal = false} class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={saving} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                        {#if saving}Saving...{:else}Save Changes{/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
    <div
        class="fixed inset-0 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-application-title"
        onkeydown={(event) => event.key === 'Escape' && (showDeleteConfirm = false)}
        tabindex="-1"
    >
        <button
            type="button"
            class="absolute inset-0 bg-black bg-opacity-50"
            onclick={() => showDeleteConfirm = false}
            aria-label="Close delete confirmation modal"
        ></button>
        <div class="relative z-10 bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <h2 id="delete-application-title" class="text-xl font-bold mb-4 text-gray-900">Confirm Deletion</h2>
            <p class="text-gray-600 mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
            <div class="flex justify-end gap-3">
                <button type="button" onclick={() => showDeleteConfirm = false} class="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="button" onclick={deleteApplication} disabled={saving} class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300">
                    {#if saving}Deleting...{:else}Yes, Delete{/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Basic styling to avoid FOUC */
    select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }
</style> 
