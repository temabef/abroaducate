<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import CoverLetterGenerator from '$lib/components/CoverLetterGenerator.svelte';
    import type { PageData } from './$types';
    import { analytics } from '$lib/utils/posthog';
    
    async function signInWithGoogle() {
        const currentUrl = '/cover-letters';
        const redirectUrl = `${location.origin}/auth/callback?next=${encodeURIComponent(currentUrl)}`;
        
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });
    }
    
    export let data: PageData;
    let { supabase, session } = data;
    
    let userData: any = null;
    let existingSOPs: any[] = [];
    let loading = false;
    let selectedSOP: any = null;
    let showGenerator = false;
    let savedCoverLetters: any[] = [];
    
    async function loadUserData() {
        try {
            // Load user profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session?.user?.id)
                .single();
                
            userData = {
                name: profile?.full_name || session?.user?.user_metadata?.full_name || '',
                email: session?.user?.email || '',
                phone: profile?.phone || '',
                address: profile?.address || ''
            };
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    async function loadExistingSOPs() {
        try {
            const { data: sops } = await supabase
                .from('sops')
                .select('id, university_name, program_name, content, created_at')
                .eq('user_id', session?.user?.id)
                .order('updated_at', { ascending: false });
                
            existingSOPs = sops || [];
        } catch (error) {
            console.error('Error loading SOPs:', error);
        }
    }
    
    async function loadSavedCoverLetters() {
        try {
            const { data: coverLetters } = await supabase
                .from('cover_letters')
                .select('*')
                .eq('user_id', session?.user?.id)
                .order('created_at', { ascending: false });
                
            savedCoverLetters = coverLetters || [];
        } catch (error) {
            console.error('Error loading saved cover letters:', error);
        }
    }
    
    onMount(async () => {
        // Track cover letter page view
        analytics.trackPageView('Cover Letter Generator', {
            user_id: session?.user?.id,
            has_saved_letters: savedCoverLetters.length > 0
        });
        
        if (session?.user) {
            loading = true;
            await Promise.all([loadUserData(), loadExistingSOPs(), loadSavedCoverLetters()]);
            loading = false;
        }
    });
    
    function startGenerator(sopData: any = null) {
        selectedSOP = sopData;
        showGenerator = true;
    }
    
    function handleCoverLetterGenerated(event: CustomEvent) {
        showGenerator = false;
        // Reload saved cover letters
        loadSavedCoverLetters();
    }
    
    function viewCoverLetter(coverLetterId: string) {
        goto(`/cover-letters/${coverLetterId}`);
    }
    
    function editCoverLetter(coverLetterId: string) {
        goto(`/cover-letters/${coverLetterId}`);
    }
    
    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    function getPositionTypeIcon(positionType: string): string {
        const icons = {
            academic: '🎓',
            industry: '💼',
            government: '🏛️',
            hybrid: '🔬'
        };
        return icons[positionType as keyof typeof icons] || '📝';
    }
    
    function getPositionTypeColor(positionType: string): string {
        const colors = {
            academic: 'bg-blue-100 text-blue-800',
            industry: 'bg-green-100 text-green-800',
            government: 'bg-red-100 text-red-800',
            hybrid: 'bg-purple-100 text-purple-800'
        };
        return colors[positionType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    }
</script>

<svelte:head>
    <title>Cover Letter Generator - Smart Professional Applications</title>
    <meta name="description" content="Generate compelling cover letters for academic and industry positions with AI-powered personalization." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20">
    <!-- Navigation Breadcrumb -->
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center space-x-2 py-4 text-sm">
                <a href="/dashboard" class="text-blue-600 hover:text-blue-800 transition-colors">Dashboard</a>
                <span class="text-gray-400">›</span>
                <span class="text-gray-600 font-medium">Cover Letters</span>
            </div>
        </div>
    </div>
    
    {#if loading}
        <!-- Loading State -->
        <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    {:else if showGenerator}
        <!-- Cover Letter Generator -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CoverLetterGenerator 
                existingUserData={userData}
                existingSOPData={selectedSOP}
                on:coverLetterGenerated={handleCoverLetterGenerated}
            />
        </div>
    {:else}
        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">
                    📝 Smart Cover Letter Generator
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                    Create compelling cover letters for academic positions, industry roles, and everything in between. 
                    Leverage your existing SOP content or start fresh.
                </p>
                

            </div>
            
            <!-- Position Type Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
                    <div class="text-3xl mb-3">🎓</div>
                    <h3 class="font-semibold mb-2">Academic Positions</h3>
                    <p class="text-sm opacity-90">PhD, PostDoc, Professor, Research Scientist</p>
                </div>
                
                <div class="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 text-center">
                    <div class="text-3xl mb-3">💼</div>
                    <h3 class="font-semibold mb-2">Industry Roles</h3>
                    <p class="text-sm opacity-90">Corporate, Startup, Consulting, Tech</p>
                </div>
                
                <div class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg p-6 text-center">
                    <div class="text-3xl mb-3">🏛️</div>
                    <h3 class="font-semibold mb-2">Government/NGO</h3>
                    <p class="text-sm opacity-90">Public sector, Policy, International</p>
                </div>
                
                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 text-center">
                    <div class="text-3xl mb-3">🔬</div>
                    <h3 class="font-semibold mb-2">Hybrid Roles</h3>
                    <p class="text-sm opacity-90">Industry R&D, Corporate Research</p>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="text-center mb-12">
                <div class="inline-flex flex-col sm:flex-row gap-4">
                    <button
                        onclick={() => startGenerator()}
                        class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg"
                    >
                        ✨ Create New Cover Letter
                    </button>
                    
                    {#if session?.user && existingSOPs.length > 0}
                        <div class="relative">
                            <select 
                                onchange={(e) => {
                                    const sopId = (e.target as HTMLSelectElement)?.value;
                                    if (sopId) {
                                        const sop = existingSOPs.find(s => s.id === sopId);
                                        startGenerator(sop);
                                    }
                                }}
                                class="px-6 py-4 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 bg-white"
                            >
                                <option value="">📄 Use Existing SOP Data</option>
                                {#each existingSOPs as sop}
                                    <option value={sop.id}>{sop.university_name} - {sop.program_name}</option>
                                {/each}
                            </select>
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Saved Cover Letters -->
            {#if session?.user && savedCoverLetters.length > 0}
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="border-b bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4">
                        <h2 class="text-xl font-bold text-gray-900">📋 Your Cover Letters</h2>
                        <p class="text-gray-600">Manage and view your saved cover letters</p>
                    </div>
                    
                    <div class="divide-y divide-gray-200">
                        {#each savedCoverLetters as coverLetter}
                            <div class="p-6 hover:bg-gray-50 transition-colors">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <span class="text-2xl">{getPositionTypeIcon(coverLetter.position_type)}</span>
                                            <div>
                                                <h3 class="text-lg font-semibold text-gray-900">{coverLetter.job_title}</h3>
                                                <p class="text-gray-600">{coverLetter.company_name}</p>
                                            </div>
                                            <span class={`px-3 py-1 rounded-full text-xs font-medium ${getPositionTypeColor(coverLetter.position_type)}`}>
                                                {coverLetter.position_type}
                                            </span>
                                        </div>
                                        
                                        <div class="flex items-center gap-4 text-sm text-gray-500">
                                            <span>📝 {coverLetter.word_count} words</span>
                                            <span>📅 {formatDate(coverLetter.created_at)}</span>
                                            {#if coverLetter.application_deadline}
                                                <span>⏰ Deadline: {formatDate(coverLetter.application_deadline)}</span>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <div class="flex gap-2">
                                        <button
                                            onclick={() => viewCoverLetter(coverLetter.id)}
                                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onclick={() => {
                                                // Download or view functionality
                                                window.open(`/api/export-document`, '_blank');
                                            }}
                                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            📤 Export
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if session?.user}
                <!-- Empty State for Logged In Users -->
                <div class="text-center py-12">
                    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-4xl">📝</span>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">No Cover Letters Yet</h3>
                    <p class="text-gray-600 mb-6">Create your first cover letter to get started</p>
                    <button
                        onclick={() => startGenerator()}
                        class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Create Your First Cover Letter
                    </button>
                </div>
            {/if}
            
            <!-- Features & Benefits -->
            <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">🎯</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Position-Specific</h3>
                    <p class="text-gray-600">Tailored content for academic, industry, and government positions</p>
                </div>
                
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">⚡</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
                    <p class="text-gray-600">Intelligent content generation that adapts to your background</p>
                </div>
                
                <div class="text-center">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">🔄</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">SOP Integration</h3>
                    <p class="text-gray-600">Leverage your existing SOP content for consistent applications</p>
                </div>
            </div>
            
            <!-- Quick Actions (original position at the bottom) -->
            <div class="mt-12 text-center">
                <div class="inline-flex gap-4">
                    <a 
                        href="/sop-generator" 
                        class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                        📝 Generate SOP
                    </a>
                    <a 
                        href="/sop-review" 
                        class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                        🔍 Review SOP
                    </a>
                    <a 
                        href="/dashboard" 
                        class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                        🏠 Dashboard
                    </a>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style> 