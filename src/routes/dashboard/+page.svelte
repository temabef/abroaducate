<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
  import QuickActions from '$lib/components/QuickActions.svelte';
  import DocumentCard from '$lib/components/DocumentCard.svelte';
  import ActivityFeed from '$lib/components/ActivityFeed.svelte';

    export let data: PageData;
    let { supabase, session } = data;

    let loading = true;
  let dashboardData: any = null;
  let error: string | null = null;

  // Pagination state for each section
  let sopPage = 1;
  let coverLetterPage = 1;
  let personalStatementPage = 1;
  const itemsPerPage = 4;

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
            error = null;
            
            const response = await fetch('/api/dashboard-data');
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to load dashboard data');
            }
            
            dashboardData = result;
            
        } catch (err) {
            console.error('Error loading dashboard:', err);
            error = err instanceof Error ? err.message : 'Unknown error occurred';
        } finally {
            loading = false;
        }
    }
    
    function formatDocumentMetadata(document: any, type: string) {
        switch (type) {
            case 'sop':
                return `${document.university_name || 'University'} • ${document.program_name || 'Program'}`;
            case 'cover_letter':
                return `${document.job_title || 'Position'} • ${document.company_name || 'Company'}`;
            case 'personal_statement':
                return `${document.program_name || 'Program'} • ${document.institution_name || 'Institution'}`;
            default:
                return 'Document';
        }
    }

    function getDocumentTitle(document: any, type: string) {
        switch (type) {
            case 'sop':
                return document.sop_title || `${document.university_name} - ${document.program_name}` || 'Untitled SOP';
            case 'cover_letter':
                return `${document.job_title} - ${document.company_name}`;
            case 'personal_statement':
                return `${document.program_name} Personal Statement`;
            default:
                return 'Untitled Document';
        }
    }

    function getEditUrl(document: any, type: string) {
        switch (type) {
            case 'sop':
                return `/sop/${document.id}`;
            case 'cover_letter':
                return `/cover-letters/${document.id}`;
            case 'personal_statement':
                return `/personal-statements/${document.id}`;
            default:
                return '#';
        }
    }

    function formatLastActivity(date: string | null) {
        if (!date) return null;
        
        const activityDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - activityDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Active now';
        if (diffHours < 24) return `Active ${diffHours}h ago`;
        if (diffDays === 1) return 'Active yesterday';
        if (diffDays < 7) return `Active ${diffDays}d ago`;
        return `Active ${activityDate.toLocaleDateString()}`;
    }

    // Pagination helper functions
    function getPaginatedItems(items: any[], page: number) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }

    function getTotalPages(totalItems: number) {
        return Math.ceil(totalItems / itemsPerPage);
    }

    function changePage(section: 'sop' | 'coverLetter' | 'personalStatement', page: number) {
        if (section === 'sop') {
            sopPage = page;
        } else if (section === 'coverLetter') {
            coverLetterPage = page;
        } else if (section === 'personalStatement') {
            personalStatementPage = page;
        }
    }

    // Reactive statements for paginated data
    $: paginatedSOPs = dashboardData ? getPaginatedItems(dashboardData.documents.sops, sopPage) : [];
    $: paginatedCoverLetters = dashboardData ? getPaginatedItems(dashboardData.documents.coverLetters, coverLetterPage) : [];
    $: paginatedPersonalStatements = dashboardData ? getPaginatedItems(dashboardData.documents.personalStatements, personalStatementPage) : [];
    
    $: sopTotalPages = dashboardData ? getTotalPages(dashboardData.documents.sops.length) : 0;
    $: coverLetterTotalPages = dashboardData ? getTotalPages(dashboardData.documents.coverLetters.length) : 0;
    $: personalStatementTotalPages = dashboardData ? getTotalPages(dashboardData.documents.personalStatements.length) : 0;
</script>

<svelte:head>
    <title>Dashboard - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
    {#if loading}
        <div class="container mx-auto px-4 py-8">
            <div class="flex items-center justify-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Loading your dashboard...</span>
            </div>
                </div>
    {:else if error}
        <div class="container mx-auto px-4 py-8">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h2 class="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
                <p class="text-red-600 mb-4">{error}</p>
                    <button
                    onclick={loadDashboardData}
                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                    </button>
            </div>
        </div>
    {:else if dashboardData}
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200">
                <div class="max-w-6xl mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">🎓 Abroaducate Dashboard</h1>
                    <p class="text-gray-600">
                        Welcome back! Here's your document portfolio overview.
                        {#if dashboardData.summary.last_activity}
                            {formatLastActivity(dashboardData.summary.last_activity)}
                        {/if}
                    </p>
                </div>
            </div>

            <div class="max-w-6xl mx-auto px-4 py-8">
                <!-- Summary Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div class="flex items-center">
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <span class="text-2xl">📊</span>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900">{dashboardData.summary.total_documents}</p>
                                <p class="text-gray-600 text-sm">Total Documents</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div class="flex items-center">
                            <div class="p-3 bg-indigo-100 rounded-lg">
                                <span class="text-2xl">📄</span>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900">{dashboardData.summary.sop_count}</p>
                                <p class="text-gray-600 text-sm">SOPs</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div class="flex items-center">
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <span class="text-2xl">📧</span>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900">{dashboardData.summary.cover_letter_count}</p>
                                <p class="text-gray-600 text-sm">Cover Letters</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div class="flex items-center">
                            <div class="p-3 bg-purple-100 rounded-lg">
                                <span class="text-2xl">💭</span>
                            </div>
                            <div class="ml-4">
                                <p class="text-2xl font-bold text-gray-900">{dashboardData.summary.personal_statement_count}</p>
                                <p class="text-gray-600 text-sm">Personal Statements</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <QuickActions />

                <!-- University Matcher Widget -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
                    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                            🏫 University Matcher
                        </h2>
                        <a href="/universities" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View Full Matcher →</a>
                    </div>
                    <div class="p-6">
                        <p class="text-gray-600 mb-4">Find universities that match your academic profile and preferences</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div class="text-2xl mb-2">🎯</div>
                                <h3 class="font-semibold text-blue-900">AI-Powered</h3>
                                <p class="text-sm text-blue-700">Intelligent matching algorithm</p>
                            </div>
                            <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div class="text-2xl mb-2">📊</div>
                                <h3 class="font-semibold text-green-900">Profile-Based</h3>
                                <p class="text-sm text-green-700">Uses your academic data</p>
                            </div>
                            <div class="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div class="text-2xl mb-2">🌍</div>
                                <h3 class="font-semibold text-purple-900">Global Reach</h3>
                                <p class="text-sm text-purple-700">Universities worldwide</p>
                            </div>
                        </div>
                        <div class="mt-6 text-center">
                            <a href="/universities" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                🚀 Start University Matching
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Document Portfolio (2/3 width) -->
                    <div class="lg:col-span-2">
                        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-xl font-bold text-gray-900">📁 Document Portfolio</h2>
                            </div>
                            
                            <div class="p-6">
                                {#if dashboardData.summary.total_documents === 0}
                                    <div class="text-center py-12">
                                        <div class="text-6xl mb-4">📝</div>
                                        <h3 class="text-lg font-semibold text-gray-700 mb-2">No documents yet</h3>
                                        <p class="text-gray-500 mb-6">Start creating your application documents using the quick actions above</p>
                                    </div>
                                {:else}
                                    <!-- SOPs Section -->
                                    {#if dashboardData.documents.sops.length > 0}
                                        <div class="mb-8">
                                            <div class="flex items-center justify-between mb-4">
                                                <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                    📄 Statements of Purpose ({dashboardData.documents.sops.length})
                                                </h3>
                                                <a href="/sop" class="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Create New</a>
                                            </div>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {#each paginatedSOPs as sop}
                                                    <DocumentCard
                                                        type="sop"
                                                        title={getDocumentTitle(sop, 'sop')}
                                                        lastEdited={sop.updated_at}
                                                        metadata={formatDocumentMetadata(sop, 'sop')}
                                                        editUrl={getEditUrl(sop, 'sop')}
                                                        wordCount={sop.word_count}
                                                    />
                                                {/each}
                                            </div>
                                                                                         {#if sopTotalPages > 1}
                                                 <div class="mt-4 flex justify-center items-center gap-2">
                                                     <button 
                                                         onclick={() => changePage('sop', sopPage - 1)}
                                                         disabled={sopPage === 1}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         ‹ Prev
                                                     </button>
                                                     <span class="px-3 py-1 text-sm text-gray-600">
                                                         Page {sopPage} of {sopTotalPages}
                                                     </span>
                                                     <button 
                                                         onclick={() => changePage('sop', sopPage + 1)}
                                                         disabled={sopPage === sopTotalPages}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         Next ›
                                                     </button>
                                                 </div>
                                             {/if}
                                        </div>
                                    {/if}

                                    <!-- Cover Letters Section -->
                                    {#if dashboardData.documents.coverLetters.length > 0}
                                        <div class="mb-8">
                                            <div class="flex items-center justify-between mb-4">
                                                <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                    📧 Cover Letters ({dashboardData.documents.coverLetters.length})
                                                </h3>
                                                <a href="/cover-letters" class="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Create New</a>
                                            </div>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {#each paginatedCoverLetters as letter}
                                                    <DocumentCard
                                                        type="cover_letter"
                                                        title={getDocumentTitle(letter, 'cover_letter')}
                                                        lastEdited={letter.updated_at}
                                                        metadata={formatDocumentMetadata(letter, 'cover_letter')}
                                                        editUrl={getEditUrl(letter, 'cover_letter')}
                                                        wordCount={null}
                                                    />
                                                {/each}
                                            </div>
                                                                                         {#if coverLetterTotalPages > 1}
                                                 <div class="mt-4 flex justify-center items-center gap-2">
                                                     <button 
                                                         onclick={() => changePage('coverLetter', coverLetterPage - 1)}
                                                         disabled={coverLetterPage === 1}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         ‹ Prev
                                                     </button>
                                                     <span class="px-3 py-1 text-sm text-gray-600">
                                                         Page {coverLetterPage} of {coverLetterTotalPages}
                                                     </span>
                                                     <button 
                                                         onclick={() => changePage('coverLetter', coverLetterPage + 1)}
                                                         disabled={coverLetterPage === coverLetterTotalPages}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         Next ›
                                                     </button>
                                                 </div>
                                             {/if}
                                        </div>
                                    {/if}
                                    
                                    <!-- Personal Statements Section -->
                                    {#if dashboardData.documents.personalStatements.length > 0}
                                        <div class="mb-8">
                                            <div class="flex items-center justify-between mb-4">
                                                <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                    💭 Personal Statements ({dashboardData.documents.personalStatements.length})
                                                </h3>
                                                <a href="/personal-statements" class="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Create New</a>
                                            </div>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {#each paginatedPersonalStatements as statement}
                                                    <DocumentCard
                                                        type="personal_statement"
                                                        title={getDocumentTitle(statement, 'personal_statement')}
                                                        lastEdited={statement.updated_at}
                                                        metadata={formatDocumentMetadata(statement, 'personal_statement')}
                                                        editUrl={getEditUrl(statement, 'personal_statement')}
                                                        wordCount={statement.word_count}
                                                    />
                                                {/each}
                                            </div>
                                                                                         {#if personalStatementTotalPages > 1}
                                                 <div class="mt-4 flex justify-center items-center gap-2">
                                                     <button 
                                                         onclick={() => changePage('personalStatement', personalStatementPage - 1)}
                                                         disabled={personalStatementPage === 1}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         ‹ Prev
                                                     </button>
                                                     <span class="px-3 py-1 text-sm text-gray-600">
                                                         Page {personalStatementPage} of {personalStatementTotalPages}
                                                     </span>
                                                     <button 
                                                         onclick={() => changePage('personalStatement', personalStatementPage + 1)}
                                                         disabled={personalStatementPage === personalStatementTotalPages}
                                                         class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         Next ›
                                                     </button>
                                                 </div>
                                             {/if}
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Activity Feed (1/3 width) -->
                    <div class="lg:col-span-1">
                        <ActivityFeed activities={dashboardData.activity} />
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div> 