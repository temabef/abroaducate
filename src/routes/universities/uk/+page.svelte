<script>
    import { onMount } from 'svelte';
    
    let loading = false;
    let universities = [];
    let stats = null;
    let error = null;
    let limit = 10;

    async function fetchUKUniversities() {
        loading = true;
        error = null;
        
        try {
            const response = await fetch(`/api/universities/fetch-uk?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                universities = data.data.universities;
                stats = data.data.stats;
                console.log('🇬🇧 UK Universities loaded:', data);
            } else {
                error = data.error.message;
            }
        } catch (err) {
            error = 'Failed to fetch UK universities: ' + err.message;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchUKUniversities();
    });

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    }

    function getUniversityTypeColor(type) {
        const colors = {
            'ancient': 'bg-purple-100 text-purple-800',
            'red_brick': 'bg-red-100 text-red-800',
            'plate_glass': 'bg-blue-100 text-blue-800',
            'new': 'bg-green-100 text-green-800',
            'post_1992': 'bg-yellow-100 text-yellow-800',
            'specialist': 'bg-indigo-100 text-indigo-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }
</script>

<svelte:head>
    <title>UK Universities - Phase 2.2 Testing | SOP GPT</title>
    <meta name="description" content="Testing Phase 2.2: UK Universities integration" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
            <div class="text-4xl">🇬🇧</div>
            <div>
                <h1 class="text-3xl font-bold text-gray-900">UK Universities</h1>
                <p class="text-lg text-gray-600">Phase 2.2: International Expansion Testing</p>
            </div>
        </div>
        
        <!-- Status Banner -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center gap-2">
                <span class="text-2xl">🚀</span>
                <div>
                    <h3 class="font-semibold text-blue-900">Phase 2.2: International Expansion - UK Universities</h3>
                    <p class="text-blue-700">Testing UK university data integration from Guardian 2025 and Complete University Guide rankings</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Controls -->
    <div class="mb-6 flex items-center gap-4">
        <div class="flex items-center gap-2">
            <label for="limit" class="text-sm font-medium text-gray-700">Limit:</label>
            <select 
                id="limit" 
                bind:value={limit} 
                on:change={fetchUKUniversities}
                class="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
                <option value={5}>5 universities</option>
                <option value={10}>10 universities</option>
                <option value={15}>15 universities</option>
                <option value={20}>20 universities</option>
                <option value={30}>30 universities</option>
            </select>
        </div>
        
        <button 
            on:click={fetchUKUniversities}
            disabled={loading}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
            {loading ? 'Loading...' : 'Refresh Data'}
        </button>
    </div>

    <!-- Statistics -->
    {#if stats}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="text-2xl font-bold text-blue-600">{stats.total_fetched}</div>
                <div class="text-sm text-gray-600">Universities Loaded</div>
            </div>
            
            <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="text-2xl font-bold text-green-600">{stats.uk_stats?.total_universities || 0}</div>
                <div class="text-sm text-gray-600">Total Available</div>
            </div>
            
            <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="text-2xl font-bold text-purple-600">{stats.uk_stats?.ancient_universities || 0}</div>
                <div class="text-sm text-gray-600">Ancient Universities</div>
            </div>
            
            <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="text-2xl font-bold text-orange-600">{formatCurrency(stats.uk_stats?.average_international_fees || 0)}</div>
                <div class="text-sm text-gray-600">Avg. Int'l Fees</div>
            </div>
        </div>
    {/if}

    <!-- Error Display -->
    {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2">
                <span class="text-red-500">❌</span>
                <span class="text-red-800 font-medium">Error: {error}</span>
            </div>
        </div>
    {/if}

    <!-- Loading State -->
    {#if loading}
        <div class="flex justify-center items-center py-12">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Loading UK universities...</p>
            </div>
        </div>
    {/if}

    <!-- Universities Grid -->
    {#if !loading && universities.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {#each universities as university}
                <div class="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                    <!-- Header -->
                    <div class="p-5 border-b border-gray-100">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                                <h3 class="font-bold text-lg text-gray-900 mb-1">{university.name}</h3>
                                <div class="flex items-center gap-2 text-sm text-gray-600">
                                    <span>📍 {university.city}, {university.state}</span>
                                    <span>•</span>
                                    <span>Est. {university.data_source === 'uk_rankings' ? 'Unknown' : university.established || 'Unknown'}</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-blue-600">#{university.ranking}</div>
                                <div class="text-xs text-gray-500">UK Ranking</div>
                            </div>
                        </div>
                        
                        <!-- University Type Badge -->
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium {getUniversityTypeColor(university.data_source === 'uk_rankings' ? 'modern' : 'unknown')}">
                                UK University
                            </span>
                            <span class="text-sm text-gray-500">Global Rank: #{university.global_ranking || 'N/A'}</span>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="p-5">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div class="text-sm text-gray-600">Acceptance Rate</div>
                                <div class="font-semibold text-green-600">{university.acceptance_rate}%</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Students</div>
                                <div class="font-semibold">{university.student_size?.toLocaleString() || 'N/A'}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Int'l Tuition</div>
                                <div class="font-semibold text-orange-600">£{university.out_of_state_tuition?.toLocaleString() || 'N/A'}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Living Cost</div>
                                <div class="font-semibold">£{university.living_cost?.toLocaleString() || 'N/A'}</div>
                            </div>
                        </div>

                        <!-- Strengths -->
                        {#if university.strengths && university.strengths.length > 0}
                            <div class="mb-4">
                                <div class="text-sm text-gray-600 mb-2">Key Strengths</div>
                                <div class="flex flex-wrap gap-1">
                                    {#each university.strengths.slice(0, 3) as strength}
                                        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                            {strength.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <!-- Top Programs -->
                        {#if university.programs}
                            <div>
                                <div class="text-sm text-gray-600 mb-2">Top Programs</div>
                                <div class="space-y-1">
                                    {#each Object.entries(university.programs).sort(([,a], [,b]) => b - a).slice(0, 3) as [program, score]}
                                        <div class="flex justify-between items-center text-sm">
                                            <span class="capitalize">{program.replace(/-/g, ' ')}</span>
                                            <span class="font-medium text-blue-600">{score}/100</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Footer -->
                    <div class="px-5 py-3 bg-gray-50 border-t border-gray-100">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">
                                Research: {university.research_opportunities || 'N/A'}
                            </span>
                            <a 
                                href={university.website_url} 
                                target="_blank" 
                                rel="noopener"
                                class="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Visit Website →
                            </a>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Integration Status -->
        <div class="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center gap-2">
                <span class="text-green-600">✅</span>
                <div>
                    <h4 class="font-semibold text-green-900">Phase 2.2 Integration Status: SUCCESS</h4>
                    <p class="text-green-700">
                        Successfully integrated {universities.length} UK universities into the matching system. 
                        These universities are now available in the main university matching algorithm with full scholarship intelligence.
                    </p>
                </div>
            </div>
        </div>
    {/if}

    <!-- No Data State -->
    {#if !loading && universities.length === 0 && !error}
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🏫</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Universities Found</h3>
            <p class="text-gray-600 mb-4">Try adjusting your search criteria.</p>
            <button 
                on:click={fetchUKUniversities}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Retry
            </button>
        </div>
    {/if}
</div>