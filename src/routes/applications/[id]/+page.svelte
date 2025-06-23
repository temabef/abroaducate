<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO, format } from 'date-fns';

    export let data: PageData;
    let { supabase, session } = data;

    const applicationId = $page.params.id;

    type Application = {
        id: string;
        university_name: string;
        program_name: string;
        country: string | null;
        application_deadline: string | null;
        application_link: string | null;
        notes: string | null;
        status: string;
        requirements_checklist: any;
        created_at: string;
        updated_at: string;
        application_fee: number | null;
    };

    let application: Application | null = null;
    let loading = true;
    let saving = false;
    let error = '';
    let showEditModal = false;
    let showDeleteConfirm = false;
    let editForm = {
        university_name: '',
        program_name: '',
        country: '',
        application_deadline: '',
        application_link: '',
        notes: ''
    };

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
                application = appData;
            }
        } catch (err) {
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
        } catch (err) {
            console.error('Error:', err);
        } finally {
            saving = false;
        }
    }

    async function updateChecklist(itemKey: string, updates: any) {
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
        } catch (err) {
            console.error('Error:', err);
        } finally {
            saving = false;
        }
    }

    function calculateProgress(checklist: any): { completed: number; total: number; percentage: number } {
        if (!checklist) return { completed: 0, total: 6, percentage: 0 };
        
        const items = Object.values(checklist);
        const total = items.length;
        
        const completed = items.filter((item: any) => {
            if (item.required_count) {
                return item.count >= item.required_count;
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
        } catch (err) {
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
        } catch (err) {
            console.error('Error:', err);
            error = 'Failed to delete application';
        } finally {
            saving = false;
            showDeleteConfirm = false;
        }
    }

    $: progress = application ? calculateProgress(application.requirements_checklist) : { completed: 0, total: 6, percentage: 0 };
    $: deadlineStatus = application ? getDeadlineStatus(application.application_deadline) : 'none';
</script>

<svelte:head>
    <title>Manage Application - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    {:else if error}
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h2 class="text-xl font-semibold text-red-800 mb-2">Error</h2>
                <p class="text-red-600">{error}</p>
                <button
                    onclick={() => goto('/applications')}
                    class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Applications
                </button>
            </div>
        </div>
    {:else if application}
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">{application.university_name}</h1>
                        <p class="text-xl text-gray-600">{application.program_name}</p>
                        {#if application.country}
                            <p class="text-gray-500">📍 {application.country}</p>
                        {/if}
                    </div>
                    <div class="flex gap-3">
                        <button
                            onclick={() => goto('/applications')}
                            class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Applications
                        </button>
                        <button
                            onclick={openEditModal}
                            class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onclick={() => showDeleteConfirm = true}
                            class="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column - Status & Overview -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                        
                        <select
                            value={application.status}
                            onchange={(e) => updateStatus((e.target as HTMLSelectElement).value)}
                            disabled={saving}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {getStatusColor(application.status)}"
                        >
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="waitlisted">Waitlisted</option>
                        </select>
                    </div>

                    <!-- Deadline Info -->
                    {#if application.application_deadline}
                        <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Application Deadline</h3>
                            <div class={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                                deadlineStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                                deadlineStatus === 'urgent' ? 'bg-red-100 text-red-800' :
                                deadlineStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                🗓️ {format(parseISO(application.application_deadline), 'PPP')}
                            </div>
                            <p class="text-sm text-gray-600 mt-2">
                                {formatDistanceToNow(parseISO(application.application_deadline), { addSuffix: true })}
                            </p>
                        </div>
                    {/if}

                    <!-- Application Link -->
                    {#if application.application_link}
                        <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Application Link</h3>
                            <a 
                                href={application.application_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                Open Application Portal
                            </a>
                            <p class="text-xs text-gray-500 mt-2 break-all">
                                {application.application_link}
                            </p>
                        </div>
                    {/if}

                    <!-- Notes -->
                    {#if application.notes}
                        <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <p class="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                    {application.notes}
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Progress Overview -->
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                        <div class="mb-3">
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Completed</span>
                                <span>{progress.completed}/{progress.total}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style="width: {progress.percentage}%"
                                ></div>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">{progress.percentage}% complete</p>
                    </div>
                </div>

                <!-- Right Column - Requirements Checklist -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-6">Requirements Checklist</h3>
                        
                        <div class="space-y-4">
                                                                    {#each Object.entries(application.requirements_checklist || {}) as [key, item]: any}
                                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        {#if item.required_count}
                                            <!-- Letters of Recommendation with counter -->
                                            <div class="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onchange={(e) => updateChecklist(key, { completed: (e.target as HTMLInputElement).checked })}
                                                    disabled={saving}
                                                    class="h-4 w-4 text-blue-600 rounded"
                                                />
                                                <div>
                                                    <span class="font-medium text-gray-900">{item.label}</span>
                                                    <div class="text-sm text-gray-600">
                                                        {item.count || 0} collected
                                                        {#if item.completed}
                                                            <span class="text-green-600 font-medium">✓ Sufficient</span>
                                                        {:else}
                                                            <span class="text-gray-500">(Check when you have enough)</span>
                                                        {/if}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="ml-auto flex items-center gap-2">
                                                <button
                                                    onclick={() => updateChecklist(key, { count: Math.max(0, (item.count || 0) - 1) })}
                                                    disabled={saving || (item.count || 0) <= 0}
                                                    class="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                                >
                                                    −
                                                </button>
                                                <span class="text-sm font-medium w-8 text-center">{item.count || 0}</span>
                                                <button
                                                    onclick={() => updateChecklist(key, { count: Math.min(item.required_count, (item.count || 0) + 1) })}
                                                    disabled={saving || (item.count || 0) >= item.required_count}
                                                    class="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        {:else}
                                            <!-- Regular checkbox items -->
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onchange={(e) => updateChecklist(key, { completed: (e.target as HTMLInputElement).checked })}
                                                disabled={saving}
                                                class="h-4 w-4 text-blue-600 rounded"
                                            />
                                            <span class="font-medium text-gray-900">{item.label}</span>
                                        {/if}
                                    </div>
                                    
                                    <div class="flex items-center gap-2">
                                        {#if item.completed}
                                            <span class="text-green-600 text-sm">✅ Complete</span>
                                        {:else}
                                            <span class="text-gray-400 text-sm">⭕ Pending</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <!-- Quick Actions -->
                        <div class="mt-8 pt-6 border-t border-gray-200">
                            <h4 class="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
                            <div class="flex gap-3 flex-wrap">
                                <button
                                    onclick={() => goto('/sop')}
                                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Create SOP
                                </button>
                                <button
                                    onclick={() => goto('/cover-letters')}
                                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create Cover Letter
                                </button>
                                <button
                                    onclick={() => goto('/academic-cv')}
                                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Create Academic CV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Application</h3>
            <p class="text-gray-600 mb-6">
                Are you sure you want to delete this application for <strong>{application?.university_name}</strong>? 
                This action cannot be undone.
            </p>
            <div class="flex gap-3">
                <button
                    onclick={() => showDeleteConfirm = false}
                    disabled={saving}
                    class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onclick={deleteApplication}
                    disabled={saving}
                    class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Edit Application Modal -->
{#if showEditModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Application</h3>
            
            <form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="space-y-4">
                <!-- University Name -->
                <div>
                    <label for="edit-university" class="block text-sm font-medium text-gray-700 mb-1">
                        University Name *
                    </label>
                    <input
                        id="edit-university"
                        type="text"
                        bind:value={editForm.university_name}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Program Name -->
                <div>
                    <label for="edit-program" class="block text-sm font-medium text-gray-700 mb-1">
                        Program Name *
                    </label>
                    <input
                        id="edit-program"
                        type="text"
                        bind:value={editForm.program_name}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Country -->
                <div>
                    <label for="edit-country" class="block text-sm font-medium text-gray-700 mb-1">
                        Country
                    </label>
                    <select
                        id="edit-country"
                        bind:value={editForm.country}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Country</option>
                        <!-- Popular Study Destinations -->
                        <option value="United States">🇺🇸 United States</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="Canada">🇨🇦 Canada</option>
                        <option value="Australia">🇦🇺 Australia</option>
                        <option value="Germany">🇩🇪 Germany</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="Netherlands">🇳🇱 Netherlands</option>
                        <option value="Singapore">🇸🇬 Singapore</option>
                        <option value="Switzerland">🇨🇭 Switzerland</option>
                        <option value="Sweden">🇸🇪 Sweden</option>
                        <option value="Norway">🇳🇴 Norway</option>
                        <option value="Denmark">🇩🇰 Denmark</option>
                        <option value="Japan">🇯🇵 Japan</option>
                        <option value="South Korea">🇰🇷 South Korea</option>
                        <option value="New Zealand">🇳🇿 New Zealand</option>
                        <option value="Ireland">🇮🇪 Ireland</option>
                        <option value="Belgium">🇧🇪 Belgium</option>
                        <option value="Austria">🇦🇹 Austria</option>
                        <option value="Italy">🇮🇹 Italy</option>
                        <option value="Spain">🇪🇸 Spain</option>
                        <option value="Finland">🇫🇮 Finland</option>
                        <!-- Separator -->
                        <option disabled>──── Other Countries ────</option>
                        <!-- Other Countries Alphabetically -->
                        <option value="Argentina">Argentina</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Chile">Chile</option>
                        <option value="China">China</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Iceland">Iceland</option>
                        <option value="India">India</option>
                        <option value="Israel">Israel</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Russia">Russia</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                    </select>
                </div>

                <!-- Application Deadline -->
                <div>
                    <label for="edit-deadline" class="block text-sm font-medium text-gray-700 mb-1">
                        Application Deadline
                    </label>
                    <input
                        id="edit-deadline"
                        type="date"
                        bind:value={editForm.application_deadline}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Application Link -->
                <div>
                    <label for="edit-application-link" class="block text-sm font-medium text-gray-700 mb-1">
                        Application Link/URL
                    </label>
                    <input
                        id="edit-application-link"
                        type="url"
                        bind:value={editForm.application_link}
                        placeholder="e.g., https://apply.university.edu/programs/ms-cs"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Notes -->
                <div>
                    <label for="edit-notes" class="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                    </label>
                    <textarea
                        id="edit-notes"
                        bind:value={editForm.notes}
                        placeholder="Personal notes, requirements, contacts, deadlines, etc."
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                </div>

                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        onclick={() => showEditModal = false}
                        disabled={saving}
                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !editForm.university_name || !editForm.program_name}
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if} 