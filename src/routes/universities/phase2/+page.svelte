<script lang="ts">
  import { onMount } from 'svelte';
  import { universityDataManager } from '$lib/database/university-integration';
  import { ukUniversityDataManager } from '$lib/database/uk-university-integration';
  import { australianUniversityManager } from '$lib/database/australia-university-integration';
  import { canadianUniversityManager } from '$lib/database/canada-university-integration';
  import { germanUniversityManager } from '$lib/database/germany-university-integration';
  import { dutchUniversityManager } from '$lib/database/netherlands-university-integration';
  import { japaneseUniversityManager } from '$lib/database/japan-university-integration';
  
  let universities: any[] = [];
  let loading = false;
  let error = '';
  let selectedSource = 'us';
  let selectedState = '';
  let selectedType = 'top';
  let limit = 50;
  let metadata: any = null;
  
  // Enhanced pagination and loading system
  let currentPage = 1;
  let totalPages = 1;
  let totalUniversities = 0;
  let loadingMore = false;
  let enhancedMode = false; // Toggle for enhanced fetching (higher limits)
  let pageSize = 24; // Universities per page
  let displayedUniversities: any[] = []; // Universities for current page (typed)
  
  // Calculate pagination
  $: {
    totalPages = Math.ceil(universities.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    displayedUniversities = universities.slice(startIndex, endIndex);
  }
  
  // US States for filtering
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
    // Enhanced fetching with automatic pagination for large datasets
  async function fetchUniversitiesEnhanced() {
    loading = true;
    error = '';
    universities = [];
    currentPage = 1;
    metadata = null;
    
    try {
      const params = new URLSearchParams({
        source: selectedSource,
        type: selectedType,
        limit: limit.toString(),
        mode: enhancedMode ? 'comprehensive' : 'standard',
        forceRefresh: 'true' // Force fresh data on each fetch
      });
      
      // Only add state parameter for countries that support it
      if (selectedState && (selectedSource === 'us' || selectedSource === 'australia' || selectedSource === 'canada' || selectedSource === 'germany' || selectedSource === 'netherlands')) {
        params.append('state', selectedState);
      }
      
      const response = await fetch(`/api/universities/fetch?${params}`);
      const data = await response.json();
      
      if (data.success) {
        universities = data.universities;
        metadata = data.metadata;
        console.log(`✅ Successfully fetched ${universities.length} universities from ${selectedSource}`);
      } else {
        error = data.error || 'Failed to fetch universities';
        console.error('❌ Fetch error:', data.error);
      }
    } catch (err) {
      error = 'Network error: ' + (err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Network error:', err);
    } finally {
      loading = false;
    }
  }

  async function fetchUniversities() {
    loading = true;
    error = '';
    universities = [];
    currentPage = 1;
    metadata = null;
    
    try {
      const params = new URLSearchParams({
        source: selectedSource,
        type: selectedType,
        limit: limit.toString(),
        forceRefresh: 'true' // Force fresh data on each fetch
      });
      
      // Only add state parameter for countries that support it
      if (selectedState && (selectedSource === 'us' || selectedSource === 'australia' || selectedSource === 'canada' || selectedSource === 'germany' || selectedSource === 'netherlands')) {
        params.append('state', selectedState);
      }
      
      const response = await fetch(`/api/universities/fetch?${params}`);
      const data = await response.json();
      
      if (data.success) {
        universities = data.universities;
        metadata = data.metadata;
        console.log(`✅ Successfully fetched ${universities.length} universities from ${selectedSource}`);
      } else {
        error = data.error || 'Failed to fetch universities';
        console.error('❌ Fetch error:', data.error);
      }
    } catch (err) {
      error = 'Network error: ' + (err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Network error:', err);
    } finally {
      loading = false;
    }
  }
  
  // Reset state when source changes
  $: if (selectedSource) {
    selectedState = ''; // Clear state filter when switching countries
    universities = []; // Clear previous results
    error = ''; // Clear previous errors
    metadata = null; // Clear previous metadata
  }
  
  onMount(() => {
    fetchUniversities();
  });
  
  function getSourceColor(source: string) {
    switch (source) {
      case 'hardcoded': return 'bg-purple-100 text-purple-800';
      case 'college_scorecard': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  // Generate internal university profile URL
  function getUniversityProfileUrl(university: any): string {
    if (university.website_url) {
      // Extract hostname from website URL
      try {
        const url = new URL(university.website_url);
        return `/universities/${url.hostname}`;
      } catch {
        // Fallback to name-based slug
        return `/universities/${university.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`;
      }
    }
    
    // Fallback to name-based slug
    return `/universities/${university.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`;
  }
</script>

<svelte:head>
  <title>Phase II: University Database Expansion - Abroaducate</title>
  <meta name="description" content="Testing Phase II expansion from 9 to 1000+ universities using free APIs" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        🚀 Phase II: University Database Expansion
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
        Testing expansion from 9 hardcoded universities to 1000+ universities using the free US College Scorecard API
      </p>
      
      <!-- Phase II Status Banner -->
      <div class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg mb-6">
        <span class="text-lg font-semibold">
          📊 Phase II: FREE API Integration Ready • 7,000+ US Universities Available
        </span>
      </div>
      
          <!-- Enhanced Database Controls -->
    <div class="mb-6">
      <button 
        on:click={() => enhancedMode = !enhancedMode}
        class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      >
        <span class="text-lg mr-2">🚀</span>
        <span class="font-semibold">
          {#if enhancedMode}
            Standard Mode (100 universities)
          {:else}
            Enhanced Mode (up to 1000 universities)
          {/if}
        </span>
        <svg class="w-4 h-4 ml-2 transition-transform duration-200 {enhancedMode ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>
    
    {#if enhancedMode}
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">⚡</span>
          <h3 class="text-lg font-semibold text-blue-900">Enhanced Database Mode</h3>
        </div>
        <p class="text-blue-800 text-sm">
          Access up to 1,000 universities with smart pagination. Results load in batches for optimal performance.
        </p>
      </div>
    {/if}
    </div>
    
    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">🔧 Test University Fetching</h2>
      
      <!-- Enhanced Mode Toggle - Top Level -->
      <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-blue-900 flex items-center gap-2">
              <span>🚀</span> Enhanced Mode
            </h3>
            <p class="text-sm text-blue-700 mt-1">
              Access up to 1000 universities with smart pagination
            </p>
          </div>
          <input type="checkbox" bind:checked={enhancedMode} class="toggle toggle-primary toggle-lg" />
        </div>
      </div>
      
      <!-- Form Controls Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Data Source</span>
          </label>
          <select bind:value={selectedSource} class="select select-bordered w-full">
            <option value="us">🇺🇸 US Universities (7,000+ available)</option>
            <option value="uk">🇬🇧 UK Universities (97 available)</option>
            <option value="australia">🇦🇺 Australia Universities (40 available)</option>
            <option value="canada">🇨🇦 Canada Universities (70 available)</option>
            <option value="germany">🇩🇪 Germany Universities (20+ available)</option>
            <option value="netherlands">🇳🇱 Netherlands Universities (20+ available)</option>
            <option value="japan">🇯🇵 Japan Universities (30 available)</option>
            <option value="france">🇫🇷 France Universities (50 available)</option>
            <option value="italy">🇮🇹 Italy Universities (45 available)</option>
          </select>
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">University Type</span>
          </label>
          <select bind:value={selectedType} class="select select-bordered w-full">
            <option value="all">All Universities</option>
            <option value="top">Top Universities (Most Selective)</option>
            <option value="state">State Universities</option>
            <option value="private">Private Universities</option>
            <option value="research">Research Universities</option>
          </select>
        </div>

        {#if selectedSource === 'us'}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">US State Filter (Optional)</span>
            </label>
            <select bind:value={selectedState} class="select select-bordered w-full">
              <option value="">All States</option>
              {#each US_STATES as state}
                <option value={state}>{state}</option>
              {/each}
            </select>
          </div>
        {:else if selectedSource === 'australia'}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Australian State Filter (Optional)</span>
            </label>
            <select bind:value={selectedState} class="select select-bordered w-full">
              <option value="">All States</option>
              <option value="New South Wales">New South Wales</option>
              <option value="Victoria">Victoria</option>
              <option value="Queensland">Queensland</option>
              <option value="Western Australia">Western Australia</option>
              <option value="South Australia">South Australia</option>
              <option value="Tasmania">Tasmania</option>
              <option value="Australian Capital Territory">Australian Capital Territory</option>
              <option value="Northern Territory">Northern Territory</option>
            </select>
          </div>
        {:else if selectedSource === 'canada'}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Canadian Province Filter (Optional)</span>
            </label>
            <select bind:value={selectedState} class="select select-bordered w-full">
              <option value="">All Provinces</option>
              <option value="Ontario">Ontario</option>
              <option value="Quebec">Quebec</option>
              <option value="British Columbia">British Columbia</option>
              <option value="Alberta">Alberta</option>
              <option value="Manitoba">Manitoba</option>
              <option value="Saskatchewan">Saskatchewan</option>
              <option value="Nova Scotia">Nova Scotia</option>
              <option value="New Brunswick">New Brunswick</option>
              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
              <option value="Prince Edward Island">Prince Edward Island</option>
            </select>
          </div>
        {:else if selectedSource === 'germany'}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">German State Filter (Optional)</span>
            </label>
            <select bind:value={selectedState} class="select select-bordered w-full">
              <option value="">All States</option>
              <option value="Bavaria">Bavaria (Bayern)</option>
              <option value="Baden-Württemberg">Baden-Württemberg</option>
              <option value="North Rhine-Westphalia">North Rhine-Westphalia</option>
              <option value="Berlin">Berlin</option>
              <option value="Saxony">Saxony (Sachsen)</option>
              <option value="Lower Saxony">Lower Saxony</option>
              <option value="Hesse">Hesse (Hessen)</option>
              <option value="Hamburg">Hamburg</option>
              <option value="Rhineland-Palatinate">Rhineland-Palatinate</option>
              <option value="Schleswig-Holstein">Schleswig-Holstein</option>
              <option value="Brandenburg">Brandenburg</option>
              <option value="Saxony-Anhalt">Saxony-Anhalt</option>
              <option value="Thuringia">Thuringia</option>
              <option value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</option>
              <option value="Bremen">Bremen</option>
              <option value="Saarland">Saarland</option>
            </select>
          </div>
        {:else if selectedSource === 'netherlands'}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Dutch Province Filter (Optional)</span>
            </label>
            <select bind:value={selectedState} class="select select-bordered w-full">
              <option value="">All Provinces</option>
              <option value="North Holland">North Holland (Amsterdam)</option>
              <option value="South Holland">South Holland (Rotterdam, The Hague)</option>
              <option value="Utrecht">Utrecht</option>
              <option value="North Brabant">North Brabant (Eindhoven)</option>
              <option value="Gelderland">Gelderland (Wageningen)</option>
              <option value="Overijssel">Overijssel (Enschede)</option>
              <option value="Limburg">Limburg (Maastricht)</option>
              <option value="Groningen">Groningen</option>
              <option value="Friesland">Friesland</option>
              <option value="Drenthe">Drenthe</option>
              <option value="Flevoland">Flevoland</option>
              <option value="Zeeland">Zeeland</option>
            </select>
          </div>
        {:else}
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Region Filter</span>
            </label>
            <select class="select select-bordered w-full" disabled>
              <option>Not applicable for {selectedSource.toUpperCase()}</option>
            </select>
          </div>
        {/if}

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">
              Limit 
              {#if enhancedMode}
                <span class="badge badge-primary badge-sm ml-2">Enhanced: up to 1000</span>
              {:else}
                <span class="badge badge-outline badge-sm ml-2">Standard: up to 100</span>
              {/if}
            </span>
          </label>
          <input 
            type="number" 
            bind:value={limit} 
            min="10" 
            max={enhancedMode ? 1000 : 100}
            class="input input-bordered w-full" 
            placeholder="Number of universities"
          />
          <div class="label">
            <span class="label-text-alt text-gray-500">
              {#if enhancedMode}
                Enhanced mode: Results load with pagination
              {:else}
                Standard mode: Quick loading, limited to 100
              {/if}
            </span>
          </div>
        </div>
      </div>

      <!-- Fetch Button -->
      <div class="flex justify-center gap-4">
        <button 
          on:click={enhancedMode ? fetchUniversitiesEnhanced : fetchUniversities}
          class="btn btn-primary btn-lg px-8"
          disabled={loading}
        >
          {#if loading}
            <span class="mr-2">⏳</span>
            Fetching Universities...
          {:else}
            <span class="mr-2">🔍</span>
            Fetch Universities
          {/if}
        </button>

        <!-- Clear Cache Button -->
        <button 
          on:click={() => {
            // Force refresh by setting forceRefresh parameter
            const currentSource = selectedSource;
            selectedSource = '';
            setTimeout(() => {
              selectedSource = currentSource;
              if (enhancedMode) {
                fetchUniversitiesEnhanced();
              } else {
                fetchUniversities();
              }
            }, 100);
          }}
          class="btn btn-outline btn-warning px-4"
          disabled={loading}
        >
          <span class="mr-2">🧹</span>
          Clear Cache & Refresh
        </button>
      </div>
    </div>
    
    <!-- Enhanced Metadata Display -->
    {#if metadata}
      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-green-800 mb-4">📊 Database Expansion Results</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
          <div>
            <span class="font-medium">Universities:</span> {universities.length.toLocaleString()}
          </div>
          <div>
            <span class="font-medium">Source:</span> {metadata.api_source}
          </div>
          <div>
            <span class="font-medium">Available:</span> {metadata.total_available}
          </div>
          <div>
            <span class="font-medium">Mode:</span> {enhancedMode ? 'Enhanced' : 'Standard'}
          </div>
          <div>
            <span class="font-medium">Updated:</span> {new Date(metadata.fetched_at).toLocaleTimeString()}
          </div>
        </div>
        
        {#if enhancedMode && universities.length > 100}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <span class="text-blue-600">🚀</span>
              <span class="font-semibold text-blue-900">Database Expansion Success!</span>
            </div>
            <p class="text-blue-800 text-sm mt-1">
              Expanded from standard 100 to {universities.length.toLocaleString()} universities 
              ({Math.round((universities.length / 100 - 1) * 100)}% increase)
            </p>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Error Display -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
        <p class="text-red-700">{error}</p>
      </div>
    {/if}
    
    <!-- Loading State -->
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="loading-dots mr-4">
          <div class="w-2 h-2 bg-blue-600 rounded-full mr-2 dot"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full mr-2 dot"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full dot"></div>
        </div>
        <span class="text-lg text-gray-600">Fetching universities from API...</span>
      </div>
    {/if}
    
    <!-- Universities Grid with Pagination -->
    {#if universities.length > 0}
      <div class="mb-8">
        <!-- Header with pagination info -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">
            🏫 Universities Found: {universities.length.toLocaleString()}
          </h2>
          
          <!-- Pagination controls -->
          {#if totalPages > 1}
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600">
                Page {currentPage} of {totalPages} 
                (Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, universities.length)} of {universities.length})
              </span>
              
              <div class="btn-group">
                <button 
                  class="btn btn-sm"
                  class:btn-disabled={currentPage === 1}
                  on:click={() => currentPage = Math.max(1, currentPage - 1)}
                >
                  ←
                </button>
                
                {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + 4);
                  return start + i;
                }).filter(page => page <= totalPages) as page}
                  <button 
                    class="btn btn-sm"
                    class:btn-active={page === currentPage}
                    on:click={() => currentPage = page}
                  >
                    {page}
                  </button>
                {/each}
                
                <button 
                  class="btn btn-sm"
                  class:btn-disabled={currentPage === totalPages}
                  on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
                >
                  →
                </button>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Universities Grid - Display only current page -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each displayedUniversities as university}
            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <!-- Header -->
              <div class="mb-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
                    {university.name}
                  </h3>
                  <span class="text-xs px-2 py-1 rounded-full {getSourceColor(university.data_source)}">
                    {university.data_source === 'hardcoded' ? 'Elite' : 'API'}
                  </span>
                </div>
                
                <div class="text-sm text-gray-600">
                  📍 {university.city ? `${university.city}, ` : ''}{university.state || university.country}
                </div>
              </div>
              
              <!-- Key Stats -->
              <div class="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span class="font-medium">Acceptance Rate:</span>
                  <div class="text-lg font-semibold text-blue-600">
                    {university.acceptance_rate ? `${university.acceptance_rate}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <span class="font-medium">Annual Cost:</span>
                  <div class="text-lg font-semibold text-green-600">
                    {formatCurrency(university.cost)}
                  </div>
                </div>
              </div>
              
              <!-- Programs -->
              {#if university.programs && Object.keys(university.programs).length > 0}
                <div class="mb-4">
                  <span class="font-medium text-sm">Top Programs:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each Object.entries(university.programs).slice(0, 3) as [program, score]}
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {program.replace(/-/g, ' ')} ({score})
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Additional Info -->
              <div class="text-xs text-gray-500 grid grid-cols-2 gap-2">
                <div>Class Size: {university.class_size || 'N/A'}</div>
                <div>Research: {university.research_opportunities || 'N/A'}</div>
                {#if university.student_size}
                  <div>Students: {university.student_size.toLocaleString()}</div>
                {/if}
                {#if university.ownership_type}
                  <div>Type: {university.ownership_type.replace(/_/g, ' ')}</div>
                {/if}
              </div>
              
              <!-- University Profile Link -->
              <div class="mt-4 pt-3 border-t border-gray-200">
                <a href={getUniversityProfileUrl(university)} 
                   class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  🏫 View University Profile →
                </a>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Bottom pagination -->
        {#if totalPages > 1}
          <div class="flex justify-center mt-8">
            <div class="btn-group">
              <button 
                class="btn btn-sm"
                class:btn-disabled={currentPage === 1}
                on:click={() => currentPage = 1}
              >
                First
              </button>
              <button 
                class="btn btn-sm"
                class:btn-disabled={currentPage === 1}
                on:click={() => currentPage = Math.max(1, currentPage - 1)}
              >
                Previous
              </button>
              <span class="btn btn-sm btn-active">
                {currentPage} / {totalPages}
              </span>
              <button 
                class="btn btn-sm"
                class:btn-disabled={currentPage === totalPages}
                on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
              >
                Next
              </button>
              <button 
                class="btn btn-sm"
                class:btn-disabled={currentPage === totalPages}
                on:click={() => currentPage = totalPages}
              >
                Last
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>