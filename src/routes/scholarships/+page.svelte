<script lang="ts">
  import { onMount } from 'svelte';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import { formatCurrencyAmount, formatScholarshipText } from '$lib/utils/htmlEntities';
  import { analytics } from '$lib/utils/posthog';
  import QuickProfileModal from '$lib/components/QuickProfileModal.svelte';
  import { loadQuickProfile, type QuickProfile, gpaMidpoint } from '$lib/services/quickProfile';
  import AdSenseAd from '$lib/components/AdSenseAd.svelte';
  
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

  // Pagination state
  let currentPage = $state(1);
  let itemsPerPage = $state(10);
  let showQuickProfile = $state(false);
  let authRequiredForProfile = $state(false);

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
    } else if (sortBy === 'match') {
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
      
      const { data: scholarshipData, error: fetchError } = await supabase
        .from('public_scholarships_decoded')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error loading scholarships:', fetchError);
        error = 'Failed to load scholarships. Please try again.';
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

  async function toggleSaved(scholarshipId: string) {
    if (!session?.user?.id) {
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
  <meta name="description" content="Browse thousands of scholarships and funding opportunities for your academic journey." />
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-16">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Scholarship Opportunities</h1>
          <p class="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${filteredScholarships.length} scholarships available`}
          </p>
        </div>
        
        <div class="flex items-center gap-4">
          <button
            onclick={() => loadScholarships()}
            class="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition duration-200"
          >
            🔄 Refresh
          </button>
          <button
            onclick={() => showFilters = !showFilters}
            class="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <div class="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
        <p class="text-red-800">{error}</p>
        <button 
          onclick={() => loadScholarships()}
          class="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    {/if}

    <!-- Search and View Mode -->
    <div class="mb-6 space-y-4">
      <!-- Search Bar -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search scholarships by title, provider, field, or location..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>
        <div class="flex gap-2">
          <select
            bind:value={sortBy}
            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="created_at">Latest First</option>
            <option value="matchScore">Best Match</option>
            <option value="deadline">Deadline</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      <!-- View Mode Tabs -->
      <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onclick={() => switchViewMode('all')}
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors {viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        >
          All ({allScholarships.length})
        </button>
        <button
          onclick={() => switchViewMode('saved')}
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors {viewMode === 'saved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        >
          Saved ({allScholarships.filter(s => s.saved).length})
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    {#if showFilters}
      <div class="mb-6 p-6 bg-white rounded-lg shadow-sm border">
        <h3 class="text-lg font-semibold mb-4">Filters</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label for="filter-funding-category" class="block text-sm font-medium text-gray-700 mb-1">Funding Category</label>
            <select
              id="filter-funding-category"
              bind:value={filters.funding_category}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">All Categories</option>
              <option value="Traditional Scholarship">🏆 Traditional Scholarship</option>
              <option value="Graduate Program Funding">🎓 Graduate Program</option>
              <option value="Advertised Position">🔬 Research Position</option>
            </select>
          </div>
          <div>
            <label for="filter-location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              id="filter-location"
              type="text"
              bind:value={filters.location}
              placeholder="e.g., United States"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label for="filter-level" class="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              id="filter-level"
              bind:value={filters.level}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">All Levels</option>
              <option value="Bachelor">Bachelor's</option>
              <option value="Master">Master's</option>
              <option value="PhD">PhD</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>
          <div>
            <label for="filter-field" class="block text-sm font-medium text-gray-700 mb-1">Field</label>
            <input
              id="filter-field"
              type="text"
              bind:value={filters.field}
              placeholder="e.g., Engineering"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label for="filter-type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="filter-type"
              bind:value={filters.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">All Types</option>
              <option value="Merit-based">Merit-based</option>
              <option value="Research-based">Research-based</option>
              <option value="Need-based">Need-based</option>
              <option value="Field-specific">Field-specific</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex gap-4">
          <button
            onclick={() => { 
              console.log('🧹 Clearing all filters');
              filters = { location: '', level: '', field: '', type: '', amount: '', deadline: '', funding_category: '' };
              searchQuery = '';
              currentPage = 1;
              updateScholarships();
            }}
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading scholarships...</p>
      </div>

    <!-- Empty State -->
    {:else if displayScholarships.length === 0}
      <div class="text-center py-12">
        <h3 class="text-lg font-medium text-gray-900 mb-2">No scholarships found</h3>
        <p class="text-gray-600 mb-4">
          {filteredScholarships.length === 0 && allScholarships.length > 0 
            ? 'Try adjusting your search or filters.' 
            : 'No scholarships available at the moment.'}
        </p>
        {#if filteredScholarships.length === 0 && allScholarships.length > 0}
          <button
            onclick={() => { 
              console.log('🧹 Clearing all filters (empty state)');
              filters = { location: '', level: '', field: '', type: '', amount: '', deadline: '', funding_category: '' };
              searchQuery = '';
              currentPage = 1;
              updateScholarships();
            }}
            class="text-yellow-600 hover:text-yellow-700 underline"
          >
            Clear all filters
          </button>
        {/if}
      </div>

      <!-- Ad after filters -->
      <div class="my-8 max-w-4xl mx-auto">
        <AdSenseAd 
          adSlot="6442575607" 
          className="bg-gray-50 p-4 rounded-lg"
          {session}
          {supabase}
        />
      </div>

    <!-- Scholarship Grid -->
    {:else}
      <div class="space-y-6">
        <!-- Pagination Info -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredScholarships.length)} of {filteredScholarships.length} scholarships
          </p>
          <div class="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        <!-- Scholarship Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {#each displayScholarships as scholarship, index (scholarship.id)}
            <!-- Insert ONE ad after the 5th item (index 4) as a single-column card on desktop -->
            {#if index === 4}
              <div class="my-2">
                <AdSenseAd adSlot="6442575607" className="bg-gray-50 p-4 rounded-lg border" />
              </div>
            {/if}
            
            <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
              <div class="p-6">
                <!-- Funding Category Badge -->
                {#if scholarship.funding_category && scholarship.funding_category !== 'Traditional Scholarship'}
                  <div class="mb-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      {scholarship.funding_category === 'Graduate Program Funding' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'}">
                      {scholarship.funding_category === 'Graduate Program Funding' ? '🎓' : '🔬'}
                      {scholarship.funding_category}
                    </span>
                  </div>
                {/if}
                
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="flex-1 mr-4">
                    <a href={`/scholarships/${scholarship.id}`} class="block hover:text-blue-600">
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">{scholarship.title}</h3>
                    </a>
                    <p class="text-gray-600">{scholarship.provider}</p>
                    {#if !(session?.user?.id && typeof scholarship.matchScore === 'number')}
                      <button class="sm:hidden mt-2 text-xs text-gray-600 underline hover:text-gray-800" onclick={() => {
                        analytics.trackEvent('quick_profile_prompt_clicked', { surface: 'scholarships', context: 'card_mobile', scholarship_id: scholarship.id, user_id: session?.user?.id });
                        if (!session?.user?.id) {
                          authMode = 'login';
                          showAuthModal = true;
                          authRequiredForProfile = true;
                        } else {
                          showQuickProfile = true;
                        }
                      }}>Complete quick profile to see match</button>
                    {/if}
                    
                    <!-- Additional info for graduate programs -->
                    {#if scholarship.funding_category === 'Graduate Program Funding' && scholarship.program_name}
                      <p class="text-sm text-blue-600 mt-1">{scholarship.program_name}</p>
                    {:else if scholarship.funding_category === 'Advertised Position' && scholarship.professor_name}
                      <p class="text-sm text-purple-600 mt-1">Prof. {scholarship.professor_name}</p>
                    {/if}
                  </div>
                  <div class="hidden sm:flex flex-col items-end">
                    {#if session?.user?.id && typeof scholarship.matchScore === 'number'}
                      <span class="text-sm font-medium {getMatchScoreColor(scholarship.matchScore)}">
                        {scholarship.matchScore}% match
                      </span>
                    {:else}
                      <button class="text-xs text-gray-500 underline hover:text-gray-700" onclick={() => {
                        analytics.trackEvent('quick_profile_prompt_clicked', { surface: 'scholarships', context: 'card', scholarship_id: scholarship.id, user_id: session?.user?.id });
                        if (!session?.user?.id) {
                          // Require login to store profile in DB
                          authMode = 'login';
                          showAuthModal = true;
                          authRequiredForProfile = true;
                        } else {
                          showQuickProfile = true;
                        }
                      }}>Complete quick profile to see match</button>
                    {/if}
                  </div>
                </div>

                <!-- Amount and Deadline -->
                <div class="flex items-center justify-between mb-4">
                  <div class="text-xl font-bold text-yellow-600">{formatCurrencyAmount(scholarship.amount)}</div>
                  {#each [getDeadlineStatus(scholarship.deadline)] as status}
                    <div>
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {status.class}">
                        {status.text}
                      </span>
                    </div>
                  {/each}
                </div>

                <!-- Details -->
                <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span class="text-gray-500">Location:</span>
                    <span class="ml-1 text-gray-900">{scholarship.location}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Level:</span>
                    <span class="ml-1 text-gray-900">
                      {#if scholarship.levels && scholarship.levels.length > 1}
                        {scholarship.levels.join(', ')}
                      {:else}
                        {scholarship.level}
                      {/if}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Field:</span>
                    <span class="ml-1 text-gray-900">{scholarship.field}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Type:</span>
                    <span class="ml-1 text-gray-900">{scholarship.type}</span>
                  </div>
                </div>

                <!-- Description -->
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">{formatScholarshipText(scholarship.description)}</p>

                <!-- Requirements -->
                {#if scholarship.requirements && scholarship.requirements.length > 0}
                  <div class="mb-4">
                    <span class="text-sm font-medium text-gray-700">Requirements:</span>
                    <div class="mt-1 flex flex-wrap gap-1">
                      {#each scholarship.requirements.slice(0, 3) as requirement}
                        <span class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {requirement}
                        </span>
                      {/each}
                      {#if scholarship.requirements.length > 3}
                        <span class="text-xs text-gray-500">+{scholarship.requirements.length - 3} more</span>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- Actions -->
                <div class="flex gap-3 pt-4 border-t">
                  <a href={`/scholarships/${scholarship.id}`} 
                    class="flex-1 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg transition duration-200 text-center"
                  >
                    View Details
                  </a>
                  
                  {#if scholarship.saved}
                    <button
                      onclick={() => toggleSaved(scholarship.id)}
                      class="flex-1 px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center justify-center"
                    >
                      <svg class="w-5 h-5 mr-1 text-yellow-500 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                      Saved
                    </button>
                  {:else}
                    <button
                      onclick={() => toggleSaved(scholarship.id)}
                      class="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition duration-200 flex items-center justify-center"
                    >
                      <svg class="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                      Save
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Add ONE ad at the end of the grid (before pagination) -->
        <div class="my-8 max-w-3xl mx-auto">
          <AdSenseAd adSlot="6442575607" className="bg-gray-50 p-4 rounded-lg border" />
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex items-center justify-center space-x-2 mt-8">
            <button
              onclick={prevPage}
              disabled={currentPage === 1}
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, start + 4);
              return start + i;
            }).filter(page => page <= totalPages) as page}
              <button
                onclick={() => goToPage(page)}
                class="px-3 py-2 text-sm font-medium {currentPage === page 
                  ? 'text-white bg-yellow-600 border-yellow-600' 
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'} border rounded-md"
              >
                {page}
              </button>
            {/each}
            
            <button
              onclick={nextPage}
              disabled={currentPage === totalPages}
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Call to Action Section -->
    <div class="mt-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-8 text-center text-white">
      <h3 class="text-2xl font-bold mb-4">Need Help with Your Applications?</h3>
      <p class="text-yellow-100 mb-6">
        Use our AI-powered tools to create compelling scholarship essays and application documents.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/sop" class="bg-white text-yellow-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
          📝 Generate Statement of Purpose
        </a>
        <a href="/cover-letters" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-yellow-600 transition duration-200">
          ✉️ Create Cover Letter
        </a>
        <a href="/dashboard" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-yellow-600 transition duration-200">
          📊 View Dashboard
        </a>
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
</div> 