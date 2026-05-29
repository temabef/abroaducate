<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import { formatCurrencyAmount, formatScholarshipText, decodeHtmlEntities } from '$lib/utils/htmlEntities';
  import { analytics } from '$lib/utils/posthog';
  import QuickProfileModal from '$lib/components/QuickProfileModal.svelte';
  import { loadQuickProfile, type QuickProfile, gpaMidpoint } from '$lib/services/quickProfile';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  interface Scholarship {
    id: string;
    title: string;
    provider: string;
    amount: string;
    deadline: string;
    location: string;
    field: string;
    level: string;
    levels?: string[]; // New multiple levels array
    type: string;
    description: string;
    requirements: string[];
    website?: string;
    min_gpa?: number;
    min_ielts?: number;
    min_toefl?: number;
    age_limit?: number;
    nationality_restrictions?: string[];
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    // Graduate funding fields
    funding_category?: string;
    university_name?: string;
    program_name?: string;
    department?: string;
    funding_type?: string;
    application_method?: string;
    professor_name?: string;
    professor_email?: string;
    position_details?: string;
    has_automatic_funding?: boolean;
    // UI state
    applied?: boolean;
    saved?: boolean;
    matchScore?: number;
  }

  // Database state
  let allScholarships: Scholarship[] = $state([]);
  let isLoading = $state(true);
  let error = $state('');

  // Display state  
  let filteredScholarships: Scholarship[] = $state([]);
  let displayScholarships: Scholarship[] = $state([]);
  let totalPages = $state(0);
  let searchQuery = $state('');
  let filters = $state({
    location: '',
    level: '',
    field: '',
    type: '',
    amount: '',
    deadline: '',
    funding_category: ''
  });
  let sortBy = $state('created_at');
  let viewMode = $state('all'); // 'all', 'saved', 'applied'
  let showFilters = $state(false);

  // Derived filter options from real data
  let countryOptions = $derived(
    [...new Set(allScholarships.map(s => s.location).filter(Boolean))].sort() as string[]
  );

  let fieldOptions = $derived(
    [...new Set(allScholarships.map(s => s.field).filter(Boolean))].sort() as string[]
  );

  function clearAllFilters() {
    filters = {
      location: '',
      level: '',
      field: '',
      type: '',
      amount: '',
      deadline: '',
      funding_category: ''
    };
    searchQuery = '';
  }

  // Pagination state
  let currentPage = $state(1);
  let itemsPerPage = $state(9);
  let showQuickProfile = $state(false);
  let authRequiredForProfile = $state(false);

  // Initialize filters from URL params (used by homepage finder)
  onMount(() => {
    const sp = $page.url.searchParams;
    const location = sp.get('location') || '';
    const level = sp.get('level') || '';
    const field = sp.get('field') || '';
    const type = sp.get('type') || '';
    const funding_category = sp.get('funding_category') || '';

    if (location || level || field || type || funding_category) {
      filters = {
        ...filters,
        location,
        level,
        field,
        type,
        funding_category
      };
      showFilters = true;
    }
  });

  // Functions for pagination
  function updateScholarships() {
    console.log("🔍 Filtering - Mode:", viewMode, "Total:", allScholarships.length);
    
    // Don't proceed if no scholarships are loaded yet
    if (allScholarships.length === 0) {
      console.log("⏳ No scholarships loaded yet, skipping filter update");
      return;
    }
    
    // First filter by view mode (all, saved, applied)
    let filtered = [...allScholarships]; // Create a copy to avoid mutation
    
    if (viewMode === 'saved') {
      filtered = filtered.filter(s => s.saved);
    } else if (viewMode === 'applied') {
      filtered = filtered.filter(s => s.applied);
    }
    
    // Then apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        s => s.title.toLowerCase().includes(query) || 
             s.provider.toLowerCase().includes(query) || 
             s.description.toLowerCase().includes(query)
      );
    }
    
    // Apply dropdown filters when set
    if (filters.location) {
      filtered = filtered.filter(s => s.location === filters.location);
    }
    if (filters.level) {
      filtered = filtered.filter(s => s.level === filters.level);
    }
    if (filters.field) {
      filtered = filtered.filter(s => s.field === filters.field || s.field === 'All Fields');
    }
    if (filters.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }
    if (filters.funding_category) {
      filtered = filtered.filter(s => s.funding_category === filters.funding_category);
    }
    
    // Sort scholarships
    if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (sortBy === 'matchScore') {
      filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === 'created_at') {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    
    // Update state
    filteredScholarships = filtered;
    
    // Calculate total pages
    totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    
    // Update display scholarships based on pagination
    updateDisplayScholarships();
    console.log("📄 Display updated - Page:", currentPage, "Showing:", displayScholarships.length);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      console.log(`📄 Going to page ${page} of ${totalPages}`);
      currentPage = page;
      updateDisplayScholarships();
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      console.log(`➡️ Next page: ${currentPage + 1} of ${totalPages}`);
      currentPage++;
      updateDisplayScholarships();
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      console.log(`⬅️ Previous page: ${currentPage - 1} of ${totalPages}`);
      currentPage--;
      updateDisplayScholarships();
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function updateDisplayScholarships() {
    if (filteredScholarships.length === 0) {
      displayScholarships = [];
      console.log("📊 No filtered scholarships to display");
      return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayScholarships = filteredScholarships.slice(startIndex, endIndex);
    console.log(`📊 Displaying ${displayScholarships.length} scholarships (page ${currentPage})`);
    console.log(`📊 Pagination: ${currentPage}/${totalPages}, Items: ${startIndex + 1}-${Math.min(endIndex, filteredScholarships.length)} of ${filteredScholarships.length}`);
  }
  
  // Simple function to switch view modes
  function switchViewMode(mode: 'all' | 'saved' | 'applied') {
    viewMode = mode;
    currentPage = 1; // Reset to first page
    updateScholarships();
  }
  
  // Filter change handler
  function handleFilterChange() {
    currentPage = 1; // Reset to first page
    updateScholarships();
  }

  async function loadScholarships() {
    isLoading = true;
    error = '';
    
    try {
      console.log('🔄 Loading scholarships...');
      
      // Primary source: decoded view (better text rendering).
      // Some Supabase views don't expose `created_at` for ordering; if so, retry without ordering.
      let scholarshipData: any[] | null = null;
      let fetchError: any = null;

      {
        const res = await supabase
          .from('public_scholarships_decoded')
          .select('*')
          .order('created_at', { ascending: false });
        scholarshipData = (res.data as any[] | null) ?? null;
        fetchError = res.error;
      }

      if (fetchError) {
        console.warn('⚠️ Decoded view ordered query failed; retrying without order.', fetchError);
        const res2 = await supabase.from('public_scholarships_decoded').select('*');
        scholarshipData = (res2.data as any[] | null) ?? null;
        fetchError = res2.error;
      }

      // Fallback: base table (keeps list working even if view is unavailable/misconfigured)
      if (fetchError) {
        console.warn('⚠️ Decoded view query failed; falling back to scholarships table.', fetchError);
        const res3 = await supabase.from('scholarships').select('*').order('created_at', { ascending: false });
        scholarshipData = (res3.data as any[] | null) ?? null;
        fetchError = res3.error;
      }

      if (fetchError) {
        console.error('❌ Error loading scholarships:', fetchError);
        error = 'Failed to load scholarships. Please try again.';
        allScholarships = [];
        filteredScholarships = [];
        displayScholarships = [];
        return;
      }

      console.log('✅ Scholarships raw data:', scholarshipData?.length || 0);

      // Load user interactions if logged in
      let userInteractions: any[] = [];
      if (session && session.user && session.user.id) {
        const { data: interactions } = await supabase
          .from('user_scholarship_interactions')
          .select('*')
          .eq('user_id', session.user.id);
        userInteractions = interactions || [];
        console.log('🔗 Loaded user interactions:', userInteractions.length);
      }

      // Merge scholarship data with user interactions
      // Try to get quick profile for client-side match scoring (anonymous allowed)
      let quickProfile: QuickProfile | null = null;
      try {
        const res = await loadQuickProfile(supabase, session);
        quickProfile = res.profile;
      } catch {}

      allScholarships = (scholarshipData || []).map(scholarship => {
        const interaction = userInteractions.find(i => i.scholarship_id === scholarship.id);
        // Simple, honest match if quick profile available
        let computedMatch: number | null = null;
        if (quickProfile) {
          let score = 0;
          // level
          if (!scholarship.level || scholarship.level === quickProfile.degree_level || scholarship.level === 'Graduate') score += 25;
          // field
          if (!scholarship.field || scholarship.field === 'All Fields' || scholarship.field.toLowerCase().includes(quickProfile.field_of_study.toLowerCase())) score += 25;
          // location
          if (!scholarship.location || quickProfile.preferred_countries.some(c => scholarship.location.toLowerCase().includes(c.toLowerCase()))) score += 20;
          // gpa
          const userGpa = gpaMidpoint(quickProfile.gpa_range);
          if (!scholarship.min_gpa || userGpa >= (scholarship.min_gpa || 0)) score += 15;
          // deadline
          const deadlineOk = scholarship.deadline && !isNaN(new Date(scholarship.deadline).getTime()) && (new Date(scholarship.deadline).getTime() - Date.now() > 30 * 24 * 60 * 60 * 1000);
          if (deadlineOk) score += 15;
          computedMatch = Math.min(100, Math.max(0, Math.round(score)));
        }

        return {
          ...scholarship,
          applied: interaction?.is_applied || false,
          saved: interaction?.is_saved || false,
          matchScore: interaction?.match_score ?? computedMatch
        };
      });
      
      console.log('✅ Scholarships loaded with interactions:', {
        total: allScholarships.length,
        saved: allScholarships.filter(s => s.saved).length,
        applied: allScholarships.filter(s => s.applied).length
      });

      // Ensure deterministic ordering even if server ordering wasn't possible
      allScholarships.sort(
        (a, b) => {
          const timeDiff = new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime();
          if (timeDiff !== 0) return timeDiff;
          // Secondary sort by id descending for deterministic tie-breaking
          return ((b as any).id || '').localeCompare((a as any).id || '');
        }
      );
      
      // Initial filtering after loading
      updateScholarships();
      // Track list viewed after data is loaded
      analytics.trackEvent('scholarships_list_viewed', {
        total: allScholarships.length,
        user_id: session?.user?.id
      });
    } catch (err) {
      console.error('❌ Error:', err);
      error = 'Failed to load scholarships. Please try again.';
      allScholarships = [];
      filteredScholarships = [];
      displayScholarships = [];
    } finally {
      isLoading = false;
      console.log('✅ Loading complete. isLoading set to false');
    }
  }

  onMount(async () => {
    // Track scholarships page view
    analytics.trackPageView('Scholarships', {
      user_id: session?.user?.id,
      view_mode: viewMode
    });
    
    // Try to load quick profile (for gating UI copy only)
    try { await loadQuickProfile(supabase, session); } catch {}
    await loadScholarships();
    // Initial filtering is already called in loadScholarships
    // Scroll to top after loading (especially helpful on mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // AdSense is now loaded globally via app.html
  });

  // Watch for changes in search query - use a more controlled approach
  let previousSearchQuery = $state('');
  $effect(() => {
    if (searchQuery !== previousSearchQuery && allScholarships.length > 0) {
      console.log('🔍 Search query changed:', searchQuery);
      previousSearchQuery = searchQuery;
      currentPage = 1;
      updateScholarships();
    }
  });
  
  // Watch for changes in filters - use a more controlled approach
  let previousFilters = $state('');
  $effect(() => {
    const currentFilters = JSON.stringify(filters);
    if (currentFilters !== previousFilters && allScholarships.length > 0) {
      console.log('📋 Filters changed:', filters);
      previousFilters = currentFilters;
      currentPage = 1;
      updateScholarships();
    }
  });
  
  // Watch for changes in sort order - use a more controlled approach
  let previousSortBy = $state('');
  $effect(() => {
    if (sortBy !== previousSortBy && allScholarships.length > 0) {
      console.log('📊 Sort order changed:', sortBy);
      previousSortBy = sortBy;
      updateScholarships();
    }
  });

  function getDeadlineStatus(deadline: string) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Expired', class: 'bg-red-100 text-red-800' };
    if (diffDays <= 7) return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, class: 'bg-red-100 text-red-800' };
    if (diffDays <= 30) return { text: `${diffDays} days left`, class: 'bg-yellow-100 text-yellow-800' };
    return { text: `${diffDays} days left`, class: 'bg-green-100 text-green-800' };
  }

  function getMatchScoreColor(score: number) {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-gray-600';
  }

  let showAuthModal = $state(false);
  let pendingSaveScholarshipId = $state<string | null>(null);
  let authMode = $state<'login' | 'signup'>('login');
  let guestToastMsg = $state('');

  async function toggleSaved(scholarshipId: string) {
    if (!session?.user?.id) {
      guestToastMsg = 'Create a free account or log in to save your favorite scholarships.';
      setTimeout(() => guestToastMsg = '', 4000);
      pendingSaveScholarshipId = scholarshipId;
      authMode = 'login';
      showAuthModal = true;
      return;
    }
    
    try {
      console.log(`Toggling saved state for scholarship ${scholarshipId}`);
      
      // Find the scholarship in our local state
      const scholarshipIndex = allScholarships.findIndex(s => s.id === scholarshipId);
      if (scholarshipIndex === -1) {
        console.error('Scholarship not found in local state');
        return;
      }
      
      const scholarship = allScholarships[scholarshipIndex];
      const currentSavedState = scholarship.saved;
      
      // Track scholarship save action
      analytics.trackEvent('scholarship_saved', {
        scholarship_id: scholarshipId,
        scholarship_title: scholarship.title,
        provider: scholarship.provider,
        action: currentSavedState ? 'unsaved' : 'saved',
        user_id: session?.user?.id
      });
      
      // Check if interaction exists in database
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarshipId)
        .single();
      
      // Handle fetch error differently from "not found"
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking interaction:', fetchError);
        throw fetchError;
      }
      
      let result;
      if (existing) {
        // Update existing interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: !currentSavedState })
          .eq('id', existing.id);
      } else {
        // Create new interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarshipId,
            is_saved: true,
            is_applied: false
          });
      }
      
      if (result.error) {
        console.error('Error updating interaction:', result.error);
        throw result.error;
      }
      
      // Update local state
      allScholarships[scholarshipIndex].saved = !currentSavedState;
      console.log('Scholarship saved state updated successfully:', !currentSavedState);
      
      // Refresh the display
      updateScholarships();
      
    } catch (err) {
      console.error('Error saving scholarship:', err);
      alert('Failed to update. Please try again.');
    }
  }

  function handleAuthSuccess() {
    if (pendingSaveScholarshipId) {
      saveScholarshipAfterLogin(pendingSaveScholarshipId);
      pendingSaveScholarshipId = null;
    }
  }

  async function saveScholarshipAfterLogin(scholarshipId: string) {
    try {
      if (session && session.user && session.user.id) {
        const scholarshipIndex = allScholarships.findIndex(s => s.id === scholarshipId);
        if (scholarshipIndex === -1) return;
        // Check if interaction exists
        const { data: existing, error: fetchError } = await supabase
          .from('user_scholarship_interactions')
          .select('id')
          .eq('user_id', session!.user!.id)
          .eq('scholarship_id', scholarshipId)
          .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      let result;
      if (existing) {
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: true })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session!.user!.id,
            scholarship_id: scholarshipId,
            is_saved: true,
            is_applied: false
          });
      }
      if (result.error) throw result.error;
      allScholarships[scholarshipIndex].saved = true;
      updateScholarships();
      }
    } catch (err) {
      alert('Failed to save scholarship after login. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Scholarships - Abroaducate</title>
  <meta name="description" content="Browse scholarships and funding opportunities." />
</svelte:head>

<div class="discovery-layout">
	<!-- HEADER: Page Title & Search -->
	<div class="discovery-header">
		<div class="header-content">
			<div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 backdrop-blur-md mb-6 shadow-xl relative z-10">
				<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
				{allScholarships.length} Actively Monitored Scholarships
			</div>
			<h1 class="page-title">Scholarship Discovery</h1>
			<p class="page-subtitle">Find merit, need-based, and research scholarships perfectly matched to your profile.</p>
			
			<div class="search-bar">
				<svg class="text-slate-400 w-5 h-5 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
				<input 
					type="text" 
					bind:value={searchQuery} 
					placeholder="Search by scholarship title, provider, field, or location..." 
					class="search-input"
				/>
			</div>
		</div>
	</div>

	<div class="discovery-body max-w-7xl mx-auto px-6 py-12">
        {#if error}
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p class="text-red-600 font-semibold">{error}</p>
            <button onclick={() => loadScholarships()} class="mt-2 text-red-700 underline text-sm">Try Again</button>
          </div>
        {/if}

        <!-- Guest feedback toast -->
        {#if guestToastMsg}
          <div class="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-fade-up-active">
            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="font-medium">{guestToastMsg}</span>
          </div>
        {/if}

        <div class="flex gap-8">

          <!-- SIDEBAR: Filters (Desktop) -->
          <aside class="w-64 flex-shrink-0 hidden lg:block">
            <div class="sticky top-24">
              <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                Filters
              </h3>

              <!-- Funding Category -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Scholarship Type</h4>
                <div class="space-y-2">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="funding_category" value="" bind:group={filters.funding_category} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">All types</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="funding_category" value="Traditional Scholarship" bind:group={filters.funding_category} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Traditional Scholarship</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="funding_category" value="Graduate Program Funding" bind:group={filters.funding_category} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Graduate Program Funding</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="funding_category" value="Advertised Position" bind:group={filters.funding_category} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Advertised Position</span>
                  </label>
                </div>
              </div>

              <!-- Level -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Level</h4>
                <div class="space-y-2">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="level" value="" bind:group={filters.level} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">All levels</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="level" value="Bachelor" bind:group={filters.level} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Bachelor's</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="level" value="Master's" bind:group={filters.level} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Master's</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="level" value="PhD" bind:group={filters.level} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">PhD</span>
                  </label>
                </div>
              </div>

              <!-- Country -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Country</h4>
                <select bind:value={filters.location} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white">
                  <option value="">All countries</option>
                  {#each countryOptions as country}
                    <option value={country}>{country}</option>
                  {/each}
                </select>
              </div>

              <!-- Field -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Field of Study</h4>
                <select bind:value={filters.field} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white">
                  <option value="">All fields</option>
                  {#each fieldOptions as field}
                    <option value={field}>{field}</option>
                  {/each}
                </select>
                <p class="text-xs text-slate-400 mt-2 leading-snug">Most scholarships accept all fields. Clear this filter to see them.</p>
              </div>

              <!-- Type -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Funding Type</h4>
                <div class="space-y-2">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="type" value="" bind:group={filters.type} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Any type</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="type" value="Merit-based" bind:group={filters.type} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Merit-based</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="type" value="Need-based" bind:group={filters.type} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Need-based</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="type" value="Research-based" bind:group={filters.type} class="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500" />
                    <span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Research-based</span>
                  </label>
                </div>
              </div>

              <!-- Clear filters -->
              <button
                onclick={clearAllFilters}
                class="w-full text-sm text-orange-600 hover:text-orange-700 font-semibold py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </aside>

          <!-- MAIN: Scholarship Grid -->
          <main class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div class="flex items-center gap-3 flex-wrap">
                <div class="bg-slate-100 p-1 rounded-xl flex inline-block">
                  <button onclick={() => switchViewMode('all')} class="px-5 py-2 rounded-lg text-sm font-bold transition-all {viewMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}">All</button>
                  <button onclick={() => switchViewMode('saved')} class="px-5 py-2 rounded-lg text-sm font-bold transition-all {viewMode === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}">Saved</button>
                </div>
                <button
                  class="lg:hidden bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  onclick={() => showFilters = !showFilters}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                  Filters
                </button>
              </div>

              <div class="flex items-center gap-3 w-full sm:w-auto">
                <p class="text-sm text-slate-500 font-medium whitespace-nowrap hidden sm:block">{filteredScholarships.length} results</p>
                <select bind:value={sortBy} class="w-full sm:w-auto text-sm bg-white border border-slate-200 rounded-xl text-slate-700 py-2.5 px-4 font-semibold shadow-sm focus:ring-orange-500 focus:border-orange-500 outline-none">
                  <option value="created_at">Latest First</option>
                  <option value="matchScore">Best Match</option>
                  <option value="deadline">Deadline (Soonest)</option>
                </select>
              </div>
            </div>

        {#if isLoading}
          <div class="py-20 flex justify-center"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy"></div></div>
        {:else if displayScholarships.length === 0}
          <div class="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <h3 class="text-xl font-bold text-slate-900 mb-2">No scholarships found</h3>
            <p class="text-slate-500">Try clearing some filters or adjusting your search.</p>
          </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {#each displayScholarships as scholarship (scholarship.id)}
                    <a href={`/scholarships/${scholarship.id}`} class="program-card">
                        <div class="p-5 flex flex-col h-full">
                            <div class="flex justify-between items-start mb-4">
                                <div class="uni-badge">
                                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    <span class="text-xs font-semibold text-slate-500 tracking-wide uppercase truncate max-w-[180px]">
                                        {decodeHtmlEntities(scholarship.provider)}
                                    </span>
                                </div>
                                <button onclick={(e) => { e.preventDefault(); toggleSaved(scholarship.id); }} class="transition-colors {scholarship.saved ? 'text-orange-500' : 'text-slate-300 hover:text-orange-500'}" aria-label="Save program">
                                    <svg class="w-6 h-6 {scholarship.saved ? 'fill-current' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                                </button>
                            </div>

                            <h3 class="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-orange-600 transition-colors">
                                {decodeHtmlEntities(scholarship.title)}
                            </h3>
                            
                            <div class="flex items-center gap-1.5 text-sm font-semibold text-slate-400 mb-4">
                                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span class="truncate">{scholarship.location}</span>
                            </div>

                            <div class="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                <div>
                                    <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Value</p>
                                    <p class="text-sm font-bold text-emerald-600 truncate">
                                        {formatCurrencyAmount(scholarship.amount) || 'Fully Funded'}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</p>
                                    <p class="text-sm font-bold {getDeadlineStatus(scholarship.deadline).class.includes('red') ? 'text-red-500' : 'text-slate-700'} truncate">
                                        {getDeadlineStatus(scholarship.deadline).text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>

            <!-- Pagination -->
            {#if totalPages > 1}
                <div class="flex items-center justify-center space-x-2 mt-12 mb-8">
                <button onclick={prevPage} disabled={currentPage === 1} class="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Prev</button>
                {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => Math.max(1, currentPage - 2) + i).filter(p => p <= totalPages) as page}
                    <button onclick={() => goToPage(page)} class="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl border transition-colors {currentPage === page ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}">{page}</button>
                {/each}
                <button onclick={nextPage} disabled={currentPage === totalPages} class="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Next</button>
                </div>
            {/if}
        {/if}
          </main>
        </div>

        <!-- Mobile filter drawer -->
        {#if showFilters}
          <div class="lg:hidden fixed inset-0 bg-black/50 z-50" onclick={() => showFilters = false} role="presentation">
            <div class="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white p-6 overflow-y-auto" onclick={(e) => e.stopPropagation()} role="presentation">
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-800 text-lg">Filters</h3>
                <button onclick={() => showFilters = false} class="text-slate-500 hover:text-slate-700" aria-label="Close filters">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Mobile: same filters as desktop -->
              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Scholarship Type</h4>
                <select bind:value={filters.funding_category} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 bg-white">
                  <option value="">All types</option>
                  <option value="Traditional Scholarship">Traditional Scholarship</option>
                  <option value="Graduate Program Funding">Graduate Program Funding</option>
                  <option value="Advertised Position">Advertised Position</option>
                </select>
              </div>

              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Level</h4>
                <select bind:value={filters.level} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 bg-white">
                  <option value="">All levels</option>
                  <option value="Bachelor">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Country</h4>
                <select bind:value={filters.location} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 bg-white">
                  <option value="">All countries</option>
                  {#each countryOptions as country}
                    <option value={country}>{country}</option>
                  {/each}
                </select>
              </div>

              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Field of Study</h4>
                <select bind:value={filters.field} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 bg-white">
                  <option value="">All fields</option>
                  {#each fieldOptions as field}
                    <option value={field}>{field}</option>
                  {/each}
                </select>
              </div>

              <div class="mb-6">
                <h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Funding Type</h4>
                <select bind:value={filters.type} class="w-full text-sm border border-slate-200 rounded-lg py-2 px-3 bg-white">
                  <option value="">Any type</option>
                  <option value="Merit-based">Merit-based</option>
                  <option value="Need-based">Need-based</option>
                  <option value="Research-based">Research-based</option>
                </select>
              </div>

              <button
                onclick={() => { clearAllFilters(); showFilters = false; }}
                class="w-full text-sm text-orange-600 hover:text-orange-700 font-semibold py-2 border border-orange-200 rounded-lg hover:bg-orange-50"
              >
                Clear all filters
              </button>
            </div>
          </div>
        {/if}

        <!-- Call to Action Section -->
        <div class="mt-12 bg-[#0f172a] rounded-[32px] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 max-w-7xl mx-auto">
            <div class="absolute left-0 top-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        </div>
        <div class="relative z-10 max-w-2xl mx-auto">
            <h3 class="text-3xl font-bold mb-4" style="font-family: 'Outfit', sans-serif;">Build Your Winning Application</h3>
            <p class="text-slate-300 mb-8 text-lg">Use the Copilot Strategy Board to craft high-converting scholarship essays and verify your profile match score.</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-full font-bold transition-colors shadow-lg shadow-orange-500/30">
                Open Dashboard
            </a>
            </div>
        </div>
        </div>
	</div>
</div>
  <AuthenticationFlow
    bind:show={showAuthModal}
    {supabase}
    mode={authMode}
    returnUrl={'/scholarships'}
    on:success={() => {
      if (authRequiredForProfile) {
        authRequiredForProfile = false;
        showQuickProfile = true;
      } else {
        handleAuthSuccess();
      }
    }}
  />
  <QuickProfileModal bind:isOpen={showQuickProfile} {supabase} {session} on:completed={() => { showQuickProfile = false; }}/> 

<style>
	.discovery-header {
		background: #0f172a;
		padding: 4rem 1.5rem 3rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.discovery-header::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		background: radial-gradient(circle at 50% -20%, rgba(249, 115, 22, 0.15), transparent 60%);
		pointer-events: none;
	}

	.header-content {
		position: relative;
		max-width: 48rem;
		margin: 0 auto;
		z-index: 10;
	}

	.page-title {
		font-family: 'Outfit', sans-serif;
		font-size: 3rem;
		font-weight: 800;
		color: white;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 2.5rem;
	}

	.search-bar {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 9999px;
		padding: 0.375rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		padding: 1rem 1rem;
		font-size: 1rem;
		color: #0f172a;
		background: transparent;
	}

	.program-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1.25rem;
		transition: all 0.2s ease;
		text-decoration: none;
		display: block;
		position: relative;
		overflow: hidden;
	}

	.program-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.08);
	}

	.uni-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		background: #f8fafc;
		border: 1px solid #f1f5f9;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
	}

	@media (max-width: 640px) {
		.page-title {
			font-size: 2.25rem;
		}
		
		.search-input {
			font-size: 0.9375rem;
		}
	}
</style>