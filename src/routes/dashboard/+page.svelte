<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import type { PageData } from './$types';
    import DocumentCard from '$lib/components/DocumentCard.svelte';
    import ActivityFeed from '$lib/components/ActivityFeed.svelte';
    import BasicReminders from '$lib/components/BasicReminders.svelte';
    import EmailStatusWidget from '$lib/components/EmailStatusWidget.svelte';
    import { analytics } from '$lib/utils/posthog';
    import QuickActionsHub from '$lib/components/dashboard/QuickActionsHub.svelte';
    import NewMatchesWidget from '$lib/components/dashboard/NewMatchesWidget.svelte';
    import ApplicationTrackerWidget from '$lib/components/dashboard/ApplicationTrackerWidget.svelte';
    import RoadmapChecklistWidget from '$lib/components/dashboard/RoadmapChecklistWidget.svelte';
    import { loadUnifiedProfile, saveUnifiedProfile, type OnboardingData } from '$lib/services/unifiedProfile';

    let { data }: { data: PageData } = $props();
    let { supabase, session } = data;

    let loading = $state(true);
  let dashboardData: any = $state(null);
  let error: string | null = $state(null);
  let unifiedProfile = $state<any>(null);

  type DashboardTab = 'roadmap' | 'documents' | 'applications' | 'tools';
  let activeTab = $state<DashboardTab>('roadmap');

  function setTab(tab: DashboardTab) {
    activeTab = tab;
    if (!browser) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }

  function mapBudgetRange(raw: string | null | undefined): OnboardingData['budget_range'] {
    const v = String(raw || '').toLowerCase();
    if (!v) return '';
    if (v.includes('nothing') || v.includes('$0') || v.includes('0')) return '0-20k';
    if (v.includes('500') || v.includes('1.5') || v.includes('2k') || v.includes('3k') || v.includes('5k')) return '0-20k';
    if (v.includes('10k') || v.includes('15k') || v.includes('20k')) return '0-20k';
    if (v.includes('30k') || v.includes('40k') || v.includes('50k')) return '20k-50k';
    if (v.includes('60k') || v.includes('70k') || v.includes('80k') || v.includes('90k') || v.includes('100k')) return '50k-100k';
    if (v.includes('100k+') || v.includes('unlimited')) return '100k+';
    return '';
  }

  function estimateGpaRange(gpaValue?: number, gpaScale?: string): OnboardingData['gpa_range'] {
    if (!gpaValue || !gpaScale) return '3.0-3.5';
    const scale = String(gpaScale);
    let gpa4 = gpaValue;
    if (scale === '5.0') gpa4 = (gpaValue / 5) * 4;
    else if (scale === '7.0') gpa4 = (gpaValue / 7) * 4;
    else if (scale === '10.0') gpa4 = (gpaValue / 10) * 4;
    else if (scale === '100') {
      if (gpaValue >= 90) gpa4 = 4.0;
      else if (gpaValue >= 80) gpa4 = 3.5;
      else if (gpaValue >= 70) gpa4 = 3.0;
      else if (gpaValue >= 60) gpa4 = 2.5;
      else gpa4 = 2.0;
    }
    if (gpa4 < 2.5) return '<2.5';
    if (gpa4 < 3.0) return '2.5-3.0';
    if (gpa4 < 3.5) return '3.0-3.5';
    return '3.5-4.0';
  }

  async function autosaveProfileFromRoadmapIfPresent() {
    if (!browser) return;
    if (!session?.user || !supabase) return;

    try {
      const raw = sessionStorage.getItem('diagnosticData');
      if (!raw) return;
      const d = JSON.parse(raw);

      const preferred_countries: string[] = Array.isArray(d.targetCountries) ? d.targetCountries : [];
      const field_of_study: string = typeof d.fieldOfStudy === 'string' ? d.fieldOfStudy : '';
      const degree_level: any = typeof d.degreeLevel === 'string' ? d.degreeLevel : '';

      // Only save if roadmap has something meaningful
      if (!preferred_countries.length && !field_of_study && !degree_level) return;

      const partial: any = {
        preferred_countries,
        field_of_study,
        degree_level: degree_level || undefined,
        current_gpa_value: typeof d.gpaValue === 'number' ? d.gpaValue : undefined,
        current_gpa_scale: typeof d.gpaScale === 'string' ? d.gpaScale : undefined,
        gpa_range: typeof d.gpaRange === 'string' && d.gpaRange ? d.gpaRange : estimateGpaRange(d.gpaValue, d.gpaScale),
        budget_range: mapBudgetRange(d.budget),
        // Roadmap flow should not force onboarding again
        onboarding_completed: true
      };

      await saveUnifiedProfile(supabase, session, partial);

      // Update local profile state and notify widgets to refresh
      const { profile } = await loadUnifiedProfile(supabase, session);
      unifiedProfile = profile;
      window.dispatchEvent(new Event('abroaducate:profile-updated'));

      // Optional: keep results page working, but avoid repeated saves
      sessionStorage.removeItem('diagnosticData');
      // Keep diagnosticResults for results page until user navigates away; don't delete here.
    } catch (e) {
      console.warn('Failed to autosave roadmap profile:', e);
    }
  }

  // Pagination state for each section
  let sopPage = $state(1);
  let coverLetterPage = $state(1);
  let personalStatementPage = $state(1);
  const itemsPerPage = 4;

    onMount(async () => {
        if (!session?.user) {
            goto('/');
            return;
        }

        if (browser) {
          const sp = new URL(window.location.href).searchParams;
          const tab = sp.get('tab');
          const from = sp.get('from');

          // If coming from diagnostic → auth → dashboard, always show the Roadmap checklist first
          if (from === 'roadmap') {
            activeTab = 'roadmap';
          }
          if (tab === 'roadmap' || tab === 'documents' || tab === 'applications' || tab === 'tools') {
            activeTab = tab;
          }
        }
        
        // Track dashboard page view
        analytics.trackPageView('Dashboard', {
            user_id: session.user.id,
            has_documents: dashboardData?.summary?.total_documents > 0
        });
        
        // If user just came from Roadmap → Auth, save their answers automatically
        await autosaveProfileFromRoadmapIfPresent();
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
    let paginatedSOPs = $derived(dashboardData ? getPaginatedItems(dashboardData.documents.sops, sopPage) : []);
    let paginatedCoverLetters = $derived(dashboardData ? getPaginatedItems(dashboardData.documents.coverLetters, coverLetterPage) : []);
    let paginatedPersonalStatements = $derived(dashboardData ? getPaginatedItems(dashboardData.documents.personalStatements, personalStatementPage) : []);
    
    let sopTotalPages = $derived(dashboardData ? getTotalPages(dashboardData.documents.sops.length) : 0);
    let coverLetterTotalPages = $derived(dashboardData ? getTotalPages(dashboardData.documents.coverLetters.length) : 0);
    let personalStatementTotalPages = $derived(dashboardData ? getTotalPages(dashboardData.documents.personalStatements.length) : 0);
</script>

<svelte:head>
    <title>Dashboard - Abroaducate</title>
</svelte:head>

<!-- Add top spacing to separate from navbar -->
<div class="pt-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
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
        <div class="min-h-screen">
            <!-- Header -->
            <div class="mt-4">
                <div class="max-w-7xl mx-auto px-4 py-8">
                    <h1 class="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
                    <p class="text-slate-600">
                        Your roadmap, matches, tools, and documents — in one place.
                        {#if dashboardData.summary.last_activity}
                            <span class="ml-2 text-slate-500">{formatLastActivity(dashboardData.summary.last_activity)}</span>
                        {/if}
                    </p>
                </div>
            </div>

            <div class="max-w-7xl mx-auto px-4 pb-12">
                <!-- Tabs -->
                <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 backdrop-blur">
                        <button
                            type="button"
                            onclick={() => setTab('roadmap')}
                            class="rounded-xl px-4 py-2 text-sm font-semibold transition {activeTab === 'roadmap' ? 'bg-[#2C3580] text-white shadow-sm' : 'text-slate-700 hover:bg-white'}"
                            aria-current={activeTab === 'roadmap' ? 'page' : undefined}
                        >
                            Roadmap
                        </button>
                        <button
                            type="button"
                            onclick={() => setTab('documents')}
                            class="rounded-xl px-4 py-2 text-sm font-semibold transition {activeTab === 'documents' ? 'bg-[#2C3580] text-white shadow-sm' : 'text-slate-700 hover:bg-white'}"
                            aria-current={activeTab === 'documents' ? 'page' : undefined}
                        >
                            Documents
                        </button>
                        <button
                            type="button"
                            onclick={() => setTab('applications')}
                            class="rounded-xl px-4 py-2 text-sm font-semibold transition {activeTab === 'applications' ? 'bg-[#2C3580] text-white shadow-sm' : 'text-slate-700 hover:bg-white'}"
                            aria-current={activeTab === 'applications' ? 'page' : undefined}
                        >
                            Applications
                        </button>
                        <button
                            type="button"
                            onclick={() => setTab('tools')}
                            class="rounded-xl px-4 py-2 text-sm font-semibold transition {activeTab === 'tools' ? 'bg-[#2C3580] text-white shadow-sm' : 'text-slate-700 hover:bg-white'}"
                            aria-current={activeTab === 'tools' ? 'page' : undefined}
                        >
                            Tools
                        </button>
                    </div>
                </div>

                {#if activeTab === 'roadmap'}
                    <div class="mb-8">
                        <RoadmapChecklistWidget
                            {supabase}
                            {session}
                            documentsSummary={dashboardData.summary}
                            applicationsCount={dashboardData.applications_count}
                        />
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <QuickActionsHub {supabase} {session} />
                        <NewMatchesWidget {supabase} {session} />
                    </div>

                    <!-- Manual AdSense block removed (auto ads only) -->
                {:else if activeTab === 'applications'}
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2">
                            <ApplicationTrackerWidget {supabase} {session} />
                        </div>
                        <div class="lg:col-span-1 space-y-6">
                            <BasicReminders userTier={dashboardData.user?.tier ? String(dashboardData.user.tier) : 'free'} />
                            <ActivityFeed activities={dashboardData.activity} />
                        </div>
                    </div>
                {:else if activeTab === 'tools'}
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2 space-y-6">
                            <QuickActionsHub {supabase} {session} />
                            <div class="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm">
                                <h2 class="text-xl font-bold text-slate-900">All tools</h2>
                                <p class="mt-1 text-sm text-slate-600">Explore everything available on your plan.</p>
                                <a
                                    href="/tools"
                                    class="mt-4 inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition"
                                >
                                    Open tools hub
                                </a>
                            </div>
                        </div>
                        <div class="lg:col-span-1 space-y-6">
                            <EmailStatusWidget userTier={dashboardData.user?.tier || 'free'} />
                            <BasicReminders userTier={dashboardData.user?.tier ? String(dashboardData.user.tier) : 'free'} />
                            <ActivityFeed activities={dashboardData.activity} />
                        </div>
                    </div>
                {:else}
                    <!-- Documents tab -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div class="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="flex items-center">
                                <div class="p-3 bg-indigo-50 rounded-xl text-indigo-700 border border-indigo-100">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 14l3-3 4 4 6-7" />
                                    </svg>
                                </div>
                                <div class="ml-4">
                                    <p class="text-2xl font-bold text-slate-900">{dashboardData.summary.total_documents}</p>
                                    <p class="text-slate-600 text-sm">Total documents</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="flex items-center">
                                <div class="p-3 bg-violet-50 rounded-xl text-violet-700 border border-violet-100">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 13h8" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 17h6" />
                                    </svg>
                                </div>
                                <div class="ml-4">
                                    <p class="text-2xl font-bold text-slate-900">{dashboardData.summary.sop_count}</p>
                                    <p class="text-slate-600 text-sm">SOPs</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="flex items-center">
                                <div class="p-3 bg-sky-50 rounded-xl text-sky-700 border border-sky-100">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16v16H4z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m22 6-10 7L2 6" />
                                    </svg>
                                </div>
                                <div class="ml-4">
                                    <p class="text-2xl font-bold text-slate-900">{dashboardData.summary.cover_letter_count}</p>
                                    <p class="text-slate-600 text-sm">Cover letters</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="flex items-center">
                                <div class="p-3 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                    </svg>
                                </div>
                                <div class="ml-4">
                                    <p class="text-2xl font-bold text-slate-900">{dashboardData.summary.personal_statement_count}</p>
                                    <p class="text-slate-600 text-sm">Personal statements</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Manual AdSense block removed (auto ads only) -->

                    <!-- Main Content Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <!-- Document Portfolio (2/3 width) -->
                        <div class="lg:col-span-2">
                            <div class="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm">
                                <div class="px-6 py-4 border-b border-slate-200">
                                    <h2 class="text-xl font-bold text-slate-900">Document portfolio</h2>
                                </div>
                                
                                <div class="p-6">
                                    {#if dashboardData.summary.total_documents === 0}
                                        <div class="text-center py-12">
                                            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 13h8" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 17h6" />
                                                </svg>
                                            </div>
                                            <h3 class="text-lg font-semibold text-slate-800 mb-2">No documents yet</h3>
                                            <p class="text-slate-600 mb-6">Create an SOP, cover letter, or CV — and keep everything organized here.</p>
                                            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                                                <a href="/sop" class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition">
                                                    Create an SOP
                                                </a>
                                                <a href="/tools" class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition">
                                                    Explore tools
                                                </a>
                                            </div>
                                        </div>
                                    {:else}
                                        <!-- SOPs Section -->
                                        {#if dashboardData.documents.sops.length > 0}
                                            <div class="mb-8">
                                                <div class="flex items-center justify-between mb-4">
                                                    <h3 class="text-lg font-semibold text-slate-800">
                                                        Statements of Purpose ({dashboardData.documents.sops.length})
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
                                                    <h3 class="text-lg font-semibold text-slate-800">
                                                        Cover Letters ({dashboardData.documents.coverLetters.length})
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
                                                    <h3 class="text-lg font-semibold text-slate-800">
                                                        Personal Statements ({dashboardData.documents.personalStatements.length})
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

                        <!-- Sidebar (1/3 width) -->
                        <div class="lg:col-span-1 space-y-6">
                            <!-- Email Status Widget -->
                            <EmailStatusWidget userTier={dashboardData.user?.tier || 'free'} />
                            
                            <!-- Basic Reminders Widget -->
                            <BasicReminders userTier={dashboardData.user?.tier ? String(dashboardData.user.tier) : 'free'} />
                            
                            <!-- Activity Feed -->
                            <ActivityFeed activities={dashboardData.activity} />
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div> 