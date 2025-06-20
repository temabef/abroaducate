<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import AddApplicationModal from '$lib/components/AddApplicationModal.svelte';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO } from 'date-fns';

    export let data: PageData;
    let { supabase, session } = data;

    type Application = {
        id: string;
        university_name: string;
        program_name: string;
        country: string | null;
        application_deadline: string | null;
        status: string;
        requirements_checklist: any;
        created_at: string;
        updated_at: string;
    };

    let applications: Application[] = [];
    let existingSOPs: Array<{id: string, university_name: string, program_name: string}> = [];
    let loading = true;
    let showAddModal = false;
    let subscriptionTier = 'free';
    let applicationLimit = 12;

    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadData();
    });

    async function loadData() {
        loading = true;
        await Promise.all([loadApplications(), loadSOPs(), loadUserProfile()]);
        loading = false;
    }

    async function loadUserProfile() {
        try {
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('subscription_tier')
                .eq('user_id', session?.user?.id)
                .single();

            if (error) {
                console.error('Error loading profile:', error);
            } else {
                subscriptionTier = profile?.subscription_tier || 'free';
                
                // Set limits based on tier
                const limits = {
                    free: 12,
                    professional: 1000,
                    elite: Infinity
                };
                applicationLimit = limits[subscriptionTier as keyof typeof limits] || 12;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

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
        }
    }

    async function loadSOPs() {
        try {
            const { data: sopsData, error } = await supabase
                .from('sops')
                .select('id, university_name, program_name')
                .eq('user_id', session?.user?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading SOPs:', error);
            } else {
                existingSOPs = sopsData || [];
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function handleApplicationCreated() {
        loadApplications(); // Refresh the list
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

    async function updateApplicationStatus(appId: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from('applications')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', appId);

            if (error) {
                console.error('Error updating status:', error);
            } else {
                await loadApplications();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
</script>

<svelte:head>
    <title>Applications - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">My Applications</h1>
                    <p class="text-gray-600">Track your university applications and deadlines</p>
                    {#if applicationLimit === Infinity}
                        <p class="text-sm text-blue-600 font-medium mt-1">
                            {applications.length} applications • Unlimited (Elite Plan)
                        </p>
                    {:else}
                        <p class="text-sm {applications.length >= applicationLimit ? 'text-red-600' : 'text-blue-600'} font-medium mt-1">
                            {applications.length} of {applicationLimit} applications used
                            {#if subscriptionTier === 'free' && applications.length >= applicationLimit * 0.8}
                                • <a href="/pricing" class="text-blue-600 hover:underline">Upgrade for more</a>
                            {/if}
                        </p>
                    {/if}
                </div>
                <div class="flex gap-3">
                    <button
                        onclick={() => goto('/dashboard')}
                        class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onclick={() => showAddModal = true}
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

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <p class="text-gray-600 mb-6">Start tracking your university applications</p>
                <button
                    onclick={() => showAddModal = true}
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Add Your First Application
                </button>
            </div>
        {:else}
            <!-- Applications List -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {#each applications as app (app.id)}
                    {@const progress = calculateProgress(app.requirements_checklist)}
                    {@const deadlineStatus = getDeadlineStatus(app.application_deadline)}
                    
                    <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all">
                        <div class="p-6">
                            <!-- Header -->
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                                        {app.university_name}
                                    </h3>
                                    <p class="text-gray-600 mb-2">{app.program_name}</p>
                                    {#if app.country}
                                        <p class="text-sm text-gray-500">📍 {app.country}</p>
                                    {/if}
                                </div>
                                
                                <div class="flex flex-col items-end gap-2">
                                    <select 
                                        value={app.status}
                                        onchange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                        class="text-xs px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 {getStatusColor(app.status)}"
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="waitlisted">Waitlisted</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Deadline -->
                            {#if app.application_deadline}
                                <div class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-4 ${
                                    deadlineStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                                    deadlineStatus === 'urgent' ? 'bg-red-100 text-red-800' :
                                    deadlineStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    🗓️ {formatDistanceToNow(parseISO(app.application_deadline), { addSuffix: true })}
                                </div>
                            {/if}
                            
                            <!-- Progress -->
                            <div class="mb-4">
                                <div class="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{progress.completed}/{progress.total}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style="width: {progress.percentage}%"
                                    ></div>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">{progress.percentage}% complete</div>
                            </div>
                            
                            <!-- Quick Stats -->
                            <div class="flex justify-between text-xs text-gray-500">
                                <span>Added {formatDistanceToNow(parseISO(app.created_at), { addSuffix: true })}</span>
                                <button 
                                    onclick={() => goto(`/applications/${app.id}`)}
                                    class="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Manage →
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Add Application Modal -->
<AddApplicationModal 
    bind:show={showAddModal} 
    {existingSOPs}
    on:applicationCreated={handleApplicationCreated}
/> 