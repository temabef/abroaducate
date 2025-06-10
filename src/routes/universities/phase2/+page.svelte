<script lang="ts">
  import { onMount } from 'svelte';
  
  let universities: any[] = [];
  let loading = false;
  let error = '';
  let selectedSource = 'us';
  let selectedState = '';
  let selectedType = 'top';
  let limit = 50;
  let metadata: any = null;
  
  // US States for filtering
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  async function fetchUniversities() {
    loading = true;
    error = '';
    
    try {
      const params = new URLSearchParams({
        source: selectedSource,
        type: selectedType,
        limit: limit.toString()
      });
      
      if (selectedState) {
        params.append('state', selectedState);
      }
      
      const response = await fetch(`/api/universities/fetch?${params}`);
      const data = await response.json();
      
      if (data.success) {
        universities = data.universities;
        metadata = data.metadata;
      } else {
        error = data.error || 'Failed to fetch universities';
      }
    } catch (err) {
      error = 'Network error: ' + (err instanceof Error ? err.message : 'Unknown error');
    } finally {
      loading = false;
    }
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
      <div class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
        <span class="text-lg font-semibold">
          📊 Phase II: FREE API Integration Ready • 7,000+ US Universities Available
        </span>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">🔧 Test University Fetching</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
          <select bind:value={selectedSource} class="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="us">US Universities (College Scorecard)</option>
            <option value="international">International (Coming Soon)</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">University Type</label>
          <select bind:value={selectedType} class="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="top">Top Universities (Most Selective)</option>
            <option value="all">All Universities</option>
            <option value="state">By State</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">State Filter (Optional)</label>
          <select bind:value={selectedState} class="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">All States</option>
            {#each US_STATES as state}
              <option value={state}>{state}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Limit</label>
          <input type="number" bind:value={limit} min="10" max="100" 
                 class="w-full border border-gray-300 rounded-md px-3 py-2">
        </div>
      </div>
      
      <button 
        on:click={fetchUniversities}
        disabled={loading}
        class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '🔄 Fetching...' : '🔍 Fetch Universities'}
      </button>
    </div>
    
    <!-- Metadata Display -->
    {#if metadata}
      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-green-800 mb-2">📊 Fetch Results</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-medium">Count:</span> {universities.length}
          </div>
          <div>
            <span class="font-medium">Source:</span> {metadata.api_source}
          </div>
          <div>
            <span class="font-medium">Available:</span> {metadata.total_available}
          </div>
          <div>
            <span class="font-medium">Fetched:</span> {new Date(metadata.fetched_at).toLocaleTimeString()}
          </div>
        </div>
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
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-lg text-gray-600">Fetching universities from API...</span>
      </div>
    {/if}
    
    <!-- Universities Grid -->
    {#if universities.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-6">
          🏫 Universities Found: {universities.length}
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each universities as university}
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
              
              <!-- Website Link -->
              {#if university.website_url}
                <div class="mt-4 pt-3 border-t border-gray-200">
                  <a href={university.website_url} target="_blank" rel="noopener noreferrer" 
                     class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    🔗 Visit Website →
                  </a>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Phase II Information -->
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
      <h2 class="text-2xl font-semibold mb-4">🎯 Phase II Progress</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">9 → 1000+</div>
          <div class="text-sm text-gray-600">University Database Expansion</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">100% FREE</div>
          <div class="text-sm text-gray-600">College Scorecard API</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600">Real-Time</div>
          <div class="text-sm text-gray-600">Live University Data</div>
        </div>
      </div>
      
      <div class="mt-6 text-sm text-gray-700">
        <h3 class="font-semibold mb-2">🚀 Phase II Features Implemented:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>✅ US College Scorecard API Integration (7,000+ institutions)</li>
          <li>✅ Hybrid system combining elite + API universities</li>
          <li>✅ Real-time data fetching with caching</li>
          <li>✅ State-based filtering and search</li>
          <li>✅ Automatic duplicate detection</li>
          <li>⏳ International university APIs (coming next)</li>
        </ul>
      </div>
    </div>
    
    <!-- Back to Main System -->
    <div class="text-center">
      <a href="/universities" 
         class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        ← Back to Main University Matching System
      </a>
    </div>
    
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 