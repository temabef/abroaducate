<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let userProfile: any = {};
    
    const dispatch = createEventDispatcher();
    
    let analyzing = false;
    let matchResults: any = null;
    let error = '';
    let showAdvancedForm = false;

    // Add pagination state
    let currentPage = 1;
    let totalPages = 1;
    let totalMatches = 0;
    let totalAvailable = 0;
    let planLimit = 50; // Will be updated from API
    let planType = 'free'; // Will be updated from API

    // Add these state variables to the component
    let loadingPage = false;
    let loadingFirstSearch = false;
    let retryCount = 0;
    let maxRetries = 2;

    // Add a request cache for the search results
    let requestCache = new Map();
    const CACHE_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes

    const valueOptions = [
        { 
            value: 'maximum_savings', 
            label: '💰 Maximum Savings Focus', 
            description: 'Prioritize universities with highest scholarship potential'
        },
        { 
            value: 'value_for_money', 
            label: '⚖️ Best Value for Money', 
            description: 'Balance quality education with cost optimization'
        },
        { 
            value: 'scholarship_hunter', 
            label: '🎯 Scholarship Hunter', 
            description: 'Target universities known for generous financial aid'
        },
        { 
            value: 'investment_focused', 
            label: '📈 ROI Investment', 
            description: 'Focus on career outcomes vs education investment'
        }
    ];

    let profileForm: {
        gpa: string;
        field: string;
        degree_level: string;
        qualities: string[];
        value_approach: string;
        research_interest: string;
        preferred_countries: string[];
        scholarship_priority: string;
    } = {
        gpa: '',
        field: '',
        degree_level: 'masters',
        qualities: [],
        value_approach: 'maximum_savings',
        research_interest: '',
        preferred_countries: [], // Will be populated with defaults if empty when submitting
        scholarship_priority: 'high'
    };

    const scholarshipPriorityOptions = [
        { value: 'essential', label: '🚨 Essential - I need significant aid', description: 'Cannot attend without substantial scholarships' },
        { value: 'high', label: '🎯 High Priority - Want to minimize costs', description: 'Actively seeking scholarships to reduce expenses' },
        { value: 'moderate', label: '⚖️ Moderate - Nice to have savings', description: 'Open to scholarships but not dependent on them' },
        { value: 'low', label: '💼 Low Priority - Focused on fit', description: 'Scholarships are bonus, prioritizing program quality' }
    ];

    const availableQualities = [
        'research-excellence',
        'innovation',
        'industry-connections',
        'academic-tradition',
        'global-reputation',
        'diversity',
        'entrepreneurship',
        'technology-focus',
        'prestigious-faculty',
        'global-network',
        'affordable-quality',
        'international-focus'
    ];

    const countries = [
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Italy',
        'Japan',
        'Netherlands'
    ];

    const countryUniversities: {[key: string]: number} = {
        'United States': 1000,
        'United Kingdom': 109,
        'Canada': 89,
        'Australia': 48,
        'Germany': 89,
        'Netherlands': 29,
        'Japan': 59,
        'France': 49,
        'Italy': 47
    };

    const budgetOptions = [
        { value: 'low', label: 'Budget-Conscious (Under $30k/year)', description: 'Affordable options with good value' },
        { value: 'moderate', label: 'Moderate Budget ($30k-60k/year)', description: 'Balanced cost and quality' },
        { value: 'high', label: 'Premium Budget ($60k-100k/year)', description: 'Focus on top-tier institutions' },
        { value: 'unlimited', label: 'No Budget Constraints', description: 'Best fit regardless of cost' }
    ];

    $: if (userProfile.gpa) {
        profileForm.gpa = userProfile.gpa;
    }
    $: if (userProfile.field) {
        profileForm.field = userProfile.field;
    }

    // Generate a cache key based on search parameters
    function generateCacheKey(profileData: any, page: number): string {
        // Create a clean copy without circular references
        const cleanData = { ...profileData };
        
        // Ensure page is a number, not an event
        const cleanPage = typeof page === 'object' ? 1 : page;
        
        const keyData = {
            gpa: cleanData.gpa,
            field: cleanData.field,
            degree_level: cleanData.degree_level,
            value_approach: cleanData.value_approach,
            scholarship_priority: cleanData.scholarship_priority,
            research_interest: cleanData.research_interest,
            preferred_countries: cleanData.preferred_countries,
            qualities: cleanData.qualities,
            page: cleanPage,
            pageSize: cleanData.pageSize
        };
        
        return JSON.stringify(keyData);
    }

    // Check cache for existing results
    function getCachedResults(profileData: any, page: number): any {
        const key = generateCacheKey(profileData, page);
        const cachedItem = requestCache.get(key);
        
        if (!cachedItem) return null;
        
        // Check if cache has expired
        if (Date.now() - cachedItem.timestamp > CACHE_LIFETIME_MS) {
            requestCache.delete(key);
            return null;
        }
        
        return cachedItem.data;
    }

    // Store results in cache
    function cacheResults(profileData: any, page: number, data: any): void {
        const key = generateCacheKey(profileData, page);
        requestCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Update the analyzeMatches function to use the cache
    async function analyzeMatches(pageNumber?: number | Event) {
        // Handle if pageNumber is an event object (from button click)
        if (pageNumber !== undefined) {
            if (typeof pageNumber === 'number') {
                currentPage = pageNumber;
            } else if (pageNumber instanceof Event) {
                // It's an event, ignore it and use current page
                console.log("Received event instead of page number, using current page:", currentPage);
            }
        }
        
        // Set appropriate loading state
        if (!matchResults) {
            loadingFirstSearch = true; // First search shows full loading UI
        analyzing = true;
        } else {
            loadingPage = true; // Subsequent pages show lighter loading UI
        }
        
        error = '';
        
        try {
            // Create a copy of the profile form to modify
            const formData = {
                ...profileForm,
                page: currentPage,
                pageSize: 10 // Show 10 results per page
            };
            
            // If no countries are selected, add default countries
            if (!formData.preferred_countries || formData.preferred_countries.length === 0) {
                console.log('No countries selected, using default countries');
                formData.preferred_countries = [
                    'United States', 
                    'United Kingdom', 
                    'Canada', 
                    'Australia',
                    'Germany',
                    'France',
                    'Italy',
                    'Japan'
                ];
            }
            
            // Check cache first to avoid redundant API calls
            const cachedResults = getCachedResults(formData, currentPage);
            if (cachedResults) {
                console.log('Using cached results for page', currentPage);
                matchResults = cachedResults;
                
                // Update pagination information from cache
                if (matchResults.pagination) {
                    currentPage = matchResults.pagination.currentPage;
                    totalPages = matchResults.pagination.totalPages;
                    totalMatches = matchResults.pagination.totalMatches;
                    totalAvailable = matchResults.pagination.totalAvailable;
                    planLimit = matchResults.pagination.planLimit;
                    planType = matchResults.pagination.planType;
                }
                
                analyzing = false;
                loadingFirstSearch = false;
                loadingPage = false;
                return;
            }
            
            console.log('Submitting university matching form with data:', formData);
            
            const response = await fetch('/api/university-matching', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Check if we got a proper response with matches
            if (!data.matches) {
                throw new Error('Invalid response format from server');
            }
            
            // Reset retry count on success
            retryCount = 0;
            matchResults = data;
            
            // Cache the results for future use
            cacheResults(formData, currentPage, data);
            
            // Update pagination information
            if (matchResults.pagination) {
                currentPage = matchResults.pagination.currentPage;
                totalPages = matchResults.pagination.totalPages;
                totalMatches = matchResults.pagination.totalMatches;
                totalAvailable = matchResults.pagination.totalAvailable;
                planLimit = matchResults.pagination.planLimit;
                planType = matchResults.pagination.planType;
            }
            
        } catch (err) {
            console.error('University matching error:', err);
            
            // Implement retry logic for network/server issues
            if (retryCount < maxRetries) {
                retryCount++;
                error = `Search attempt ${retryCount} failed. Retrying...`;
                
                // Wait a moment before retrying
                setTimeout(() => {
                    analyzeMatches(currentPage);
                }, 1500);
                return;
            }
            
            // If we've exhausted retries, show friendly error
            error = 'We encountered a problem finding your university matches. Please try again with fewer filters, or contact support if the issue persists.';
        } finally {
            analyzing = false;
            loadingFirstSearch = false;
            loadingPage = false;
        }
    }

    // Navigation functions for pagination
    function handlePrevPage() {
        if (currentPage > 1) {
            analyzeMatches(currentPage - 1);
        }
    }

    function handleNextPage() {
        if (currentPage < totalPages) {
            analyzeMatches(currentPage + 1);
        }
    }

    function handlePageClick(page: number) {
        if (page >= 1 && page <= totalPages) {
            analyzeMatches(page);
        }
    }

    function toggleQuality(quality: string) {
        if (profileForm.qualities.includes(quality)) {
            profileForm.qualities = profileForm.qualities.filter(q => q !== quality);
        } else {
            profileForm.qualities = [...profileForm.qualities, quality];
        }
    }

    function toggleCountry(country: string) {
        if (profileForm.preferred_countries.includes(country)) {
            profileForm.preferred_countries = profileForm.preferred_countries.filter(c => c !== country);
        } else {
            profileForm.preferred_countries = [...profileForm.preferred_countries, country];
        }
    }

    function getMatchColor(score: number): string {
        if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 55) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    }

    function getProbabilityColor(probability: string): string {
        switch (probability) {
            case 'High': return 'text-green-600 bg-green-100';
            case 'Moderate': return 'text-blue-600 bg-blue-100';
            case 'Low': return 'text-yellow-600 bg-yellow-100';
            case 'Very Low': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    function getCostFitColor(costFit: string): string {
        switch (costFit) {
            case 'Excellent': return 'text-green-600 bg-green-100';
            case 'Good': return 'text-blue-600 bg-blue-100';
            case 'Fair (with aid)': return 'text-yellow-600 bg-yellow-100';
            case 'Challenging': return 'text-orange-600 bg-orange-100';
            case 'Poor fit': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    function getBreakdownScore(score: number): string {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Fair';
        if (score >= 40) return 'Poor';
        return 'Very Poor';
    }

    function getBreakdownColor(score: number): string {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }

    // NEW: Scholarship Intelligence Color Functions
    function getAffordabilityColor(rating: string): string {
        switch (rating) {
            case 'Excellent': return 'text-green-600';
            case 'Good': return 'text-blue-600';
            case 'Fair': return 'text-yellow-600';
            case 'Challenging': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    function getAffordabilityBadgeColor(rating: string): string {
        switch (rating) {
            case 'Excellent': return 'text-green-700 bg-green-100';
            case 'Good': return 'text-blue-700 bg-blue-100';
            case 'Fair': return 'text-yellow-700 bg-yellow-100';
            case 'Challenging': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    }

    function getScholarshipMatchColor(score: number): string {
        if (score >= 85) return 'text-green-700 bg-green-100';
        if (score >= 70) return 'text-blue-700 bg-blue-100';
        if (score >= 55) return 'text-yellow-700 bg-yellow-100';
        return 'text-gray-700 bg-gray-100';
    }

    function getTotalUniversities(selectedCountries: string[]): number {
        if (!selectedCountries || selectedCountries.length === 0) {
            // If no countries selected, use default countries
            return countryUniversities['United States'] + 
                   countryUniversities['United Kingdom'] + 
                   countryUniversities['Canada'] + 
                   countryUniversities['Australia'] + 
                   countryUniversities['Germany'] + 
                   countryUniversities['France'] + 
                   countryUniversities['Italy'] + 
                   countryUniversities['Japan'];
        }
        
        return selectedCountries.reduce((total, country) => {
            return total + (countryUniversities[country] || 0);
        }, 0);
    }

    // Add helper function to determine upgrade plan based on current plan
    function getUpgradePlan() {
        if (planType === 'free') {
            return {
                plan: 'professional',
                limit: 500,
                cta: 'Upgrade to Professional'
            };
        } else if (planType === 'professional') {
            return {
                plan: 'elite',
                limit: 1500,
                cta: 'Upgrade to Elite'
            };
        }
        return null;
    }

    // Helper to calculate percentage
    function calculatePercentage(value: number, total: number): number {
        if (total === 0) return 0;
        return Math.min(100, Math.round((value / total) * 100));
    }
</script>

<div class="university-matcher bg-white rounded-lg shadow-sm border p-6">
    <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">🎯 AI University Matching System</h3>
            <button 
                class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                on:click={() => showAdvancedForm = !showAdvancedForm}
            >
                {showAdvancedForm ? '▼ Hide' : '▶ Show'} Advanced Options
            </button>
        </div>
        <p class="text-gray-600 text-sm">
            Get AI-powered university recommendations based on your academic profile, preferences, and budget.
        </p>
    </div>

    <!-- Enhanced Profile Form -->
    <div class="profile-form mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    GPA/CGPA <span class="text-red-500">*</span>
                </label>
                <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="4.0"
                    bind:value={profileForm.gpa}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3.75"
                    required
                >
                <p class="text-xs text-gray-500 mt-1">On a 4.0 scale</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study <span class="text-red-500">*</span>
                </label>
                <input 
                    type="text"
                    bind:value={profileForm.field}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Computer Science, Business, Medicine"
                    required
                >
                <p class="text-xs text-gray-500 mt-1">Your major or intended field</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Degree Level
                </label>
                <select 
                    bind:value={profileForm.degree_level}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="undergraduate">Undergraduate/Bachelor's</option>
                    <option value="masters">Master's/Graduate</option>
                    <option value="phd">PhD/Doctoral</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Value Approach
                </label>
                <select 
                    bind:value={profileForm.value_approach}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {#each valueOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
        </div>

        {#if showAdvancedForm}
            <div class="advanced-options space-y-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Scholarship Priority
                    </label>
                    <select 
                        bind:value={profileForm.scholarship_priority}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {#each scholarshipPriorityOptions as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">How important are scholarships to your decision?</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        What do you value in a university? (Select up to 5)
                    </label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {#each availableQualities as quality}
                            <label class="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white rounded px-2 py-1">
                                <input 
                                    type="checkbox" 
                                    checked={profileForm.qualities.includes(quality)}
                                    on:change={() => toggleQuality(quality)}
                                    disabled={!profileForm.qualities.includes(quality) && profileForm.qualities.length >= 5}
                                    class="rounded"
                                >
                                <span class="capitalize">{quality.replace('-', ' ')}</span>
                            </label>
                        {/each}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Selected: {profileForm.qualities.length}/5</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Countries (Optional)
                    </label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {#each countries as country}
                            <label class="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white rounded px-2 py-1">
                                <input 
                                    type="checkbox" 
                                    checked={profileForm.preferred_countries.includes(country)}
                                    on:change={() => toggleCountry(country)}
                                    class="rounded"
                                >
                                <span>{country} <span class="text-xs text-gray-500">({countryUniversities[country]})</span></span>
                            </label>
                        {/each}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                        If no countries are selected, we'll search across top universities in US, UK, Canada, Australia, Germany, France, Italy, and Japan
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Research Interests (Optional)
                    </label>
                    <textarea 
                        bind:value={profileForm.research_interest}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your research interests or career goals..."
                        rows="3"
                    ></textarea>
                    <p class="text-xs text-gray-500 mt-1">Helps improve research-focused recommendations</p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Action Button -->
    <div class="mb-6">
        <button 
            on:click={analyzeMatches}
            disabled={analyzing || !profileForm.gpa || !profileForm.field}
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
            {analyzing ? '🔍 Analyzing Universities...' : '🎯 Find Perfect University Matches'}
        </button>
    </div>

    <!-- Error Display -->
    {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
            <span class="mr-2">⚠️</span>
            {error}
        </div>
    {/if}

    <!-- Enhanced Results -->
    {#if matchResults}
        <div class="results space-y-6">
            <!-- Plan Information -->
            {#if matchResults.pagination}
                <div class="plan-info bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                    <h5 class="text-sm font-medium text-blue-800 mb-2">University Access</h5>
                    <div class="flex items-center mb-2">
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mr-4">
                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: {calculatePercentage(planLimit, totalAvailable)}%"></div>
                        </div>
                        <span class="text-xs whitespace-nowrap">
                            <span class="font-medium">{planLimit}</span>/{totalAvailable} universities
                        </span>
                    </div>
                    
                    {#if planLimit < totalAvailable}
                        <div class="mt-2 text-xs text-blue-700">
                            <p>
                                Your current plan gives you access to {planLimit} universities.
                                {#if planType !== 'elite'}
                                    <a href="/pricing" class="underline font-medium">
                                        {planType === 'free' ? 'Upgrade to Professional' : 'Upgrade to Elite'} 
                                        for access to {planType === 'free' ? '500' : '1500+'} universities.
                                    </a>
                                {/if}
                            </p>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Enhanced Summary -->
            <div class="summary bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                    📊 Analysis Summary
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{totalMatches}</div>
                        <div class="text-gray-600">Matching Universities</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">
                            {matchResults.matches ? matchResults.matches.filter((m: any) => m.match_score >= 80).length : 0}
                        </div>
                        <div class="text-gray-600">Excellent Matches</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">
                            {matchResults.matches ? matchResults.matches.filter((m: any) => m.admission_probability === 'High').length : 0}
                        </div>
                        <div class="text-gray-600">High Probability</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600">
                            {matchResults.matches ? matchResults.matches.filter((m: any) => m.estimated_cost_fit === 'Excellent' || m.estimated_cost_fit === 'Good').length : 0}
                        </div>
                        <div class="text-gray-600">Budget Friendly</div>
                    </div>
                </div>
                <div class="bg-white p-3 rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-700">
                        <span class="font-medium">Showing:</span> {matchResults.matches ? matchResults.matches.length : 0} universities (page {currentPage} of {totalPages})
                    </p>
                </div>
            </div>

            <!-- Enhanced Recommendations -->
            {#if matchResults.recommendations && matchResults.recommendations.length > 0}
                <div class="recommendations bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 class="font-semibold text-green-900 mb-3 flex items-center">
                        💡 AI Recommendations
                    </h4>
                    <ul class="space-y-2 text-sm text-green-800">
                        {#each matchResults.recommendations as recommendation}
                            <li class="flex items-start">
                                <span class="mr-2 mt-0.5">•</span>
                                {recommendation}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <!-- Enhanced University Matches -->
            <div class="matches">
                <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                    🏛️ University Matches
                    <span class="ml-2 text-sm font-normal text-gray-500">
                        (Ranked by compatibility)
                    </span>
                </h4>
                {#if loadingPage}
                    <div class="flex justify-center items-center py-8">
                        <div class="animate-pulse flex space-x-2">
                            <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <div class="w-2 h-2 bg-blue-600 rounded-full delay-100"></div>
                            <div class="w-2 h-2 bg-blue-600 rounded-full delay-200"></div>
                        </div>
                        <span class="ml-3 text-gray-600">Loading page {currentPage}...</span>
                    </div>
                {:else if matchResults && matchResults.matches && matchResults.matches.length === 0}
                    <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
                        <div class="text-yellow-600 text-lg mb-2">No matching universities found</div>
                        <p class="text-yellow-700">
                            Try adjusting your search criteria or consider broadening your preferences.
                        </p>
                    </div>
                {:else}
                <div class="space-y-6">
                    {#each matchResults.matches as match, index}
                            <div class="university-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <!-- University Header -->
                            <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-xl font-bold text-gray-900 mb-1">{match.university.name}</h4>
                                        <div class="flex items-center text-sm text-gray-600">
                                            <span class="mr-4">{match.university.country}</span>
                                            {#if match.university.region}
                                                <span>{match.university.region}</span>
                                            {/if}
                                    </div>
                                    </div>
                                    <div class={`match-score px-3 py-2 rounded-full text-sm font-medium border ${getMatchColor(match.match_score)}`}>
                                        {match.match_score}% Match
                                    </div>
                                </div>

                                <!-- Main Info -->
                                <div class="flex justify-between mb-6">
                                    <div>
                                    <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                        <span class="flex items-center">
                                            🏆 #{match.university.ranking} globally
                                        </span>
                                        <span class="flex items-center">
                                            📊 {match.university.acceptance_rate}% acceptance
                                        </span>
                                        <span class="flex items-center">
                                            💰 {formatCurrency(match.university.cost)}/year
                                        </span>
                                    </div>
                                </div>
                                <div class="text-right space-y-2">
                                    <div class={`px-2 py-1 rounded text-xs font-medium ${getProbabilityColor(match.admission_probability)}`}>
                                        {match.admission_probability} Chance
                                    </div>
                                    <div class={`px-2 py-1 rounded text-xs font-medium ${getCostFitColor(match.estimated_cost_fit)}`}>
                                        {match.estimated_cost_fit}
                                    </div>
                                </div>
                            </div>

                                <!-- Professional & Elite Tier Content -->
                                {#if planType === 'professional' || planType === 'elite'}
                                {#if match.strengths && match.strengths.length > 0}
                                        <div class="mb-4 p-3 bg-green-50 rounded-lg">
                                            <h5 class="text-sm font-medium text-green-800 mb-2 flex items-center">
                                                <span class="mr-2">✅</span> Strengths
                                            </h5>
                                            <ul class="text-xs text-green-700 space-y-1">
                                            {#each match.strengths as strength}
                                                <li class="flex items-start">
                                                        <span class="mr-2">•</span>
                                                    {strength}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}

                                {#if match.concerns && match.concerns.length > 0}
                                        <div class="mb-4 p-3 bg-yellow-50 rounded-lg">
                                            <h5 class="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                                                <span class="mr-2">⚠️</span> Areas to Consider
                                            </h5>
                                            <ul class="text-xs text-yellow-700 space-y-1">
                                            {#each match.concerns as concern}
                                                <li class="flex items-start">
                                                        <span class="mr-2">•</span>
                                                    {concern}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}

                                    {#if match.match_breakdown}
                                        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <h5 class="text-sm font-medium text-blue-800 mb-2">Match Breakdown</h5>
                                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {#each Object.entries(match.match_breakdown) as [key, value]}
                                                    <div class="text-xs">
                                                        <div class="font-medium mb-1">{key.replace(/_/g, ' ')}:</div>
                                                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div class="bg-blue-600 h-1.5 rounded-full" style="width: {value}%"></div>
                                                        </div>
                                                        <div class="text-right mt-0.5 text-gray-600">{value}%</div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                {/if}

                                <!-- Elite Tier Only Content -->
                                {#if planType === 'elite'}
                                {#if match.improvement_suggestions && match.improvement_suggestions.length > 0}
                                        <div class="mb-4 p-3 bg-purple-50 rounded-lg">
                                            <h5 class="text-sm font-medium text-purple-800 mb-2 flex items-center">
                                                <span class="mr-2">💡</span> Pro Tips (Elite Feature)
                                            </h5>
                                            <ul class="text-xs text-purple-700 space-y-1">
                                            {#each match.improvement_suggestions as suggestion}
                                                <li class="flex items-start">
                                                        <span class="mr-2">•</span>
                                                    {suggestion}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}
                                {/if}

                                <!-- Teaser for Free Users -->
                                {#if planType === 'free'}
                                    <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                        <div class="flex justify-between items-center">
                                            <h5 class="text-sm font-medium text-blue-800">Advanced Analysis</h5>
                                            <a href="/pricing" class="text-xs font-medium text-blue-700 hover:text-blue-800 underline">
                                                Upgrade for More Details →
                                            </a>
                                            </div>
                                        <p class="text-xs text-blue-600 mt-1">
                                            Upgrade to Professional for strengths, concerns, and match breakdown. 
                                            Elite users get access to personalized application strategies.
                                        </p>
                                        </div>
                                {/if}

                                <!-- Scholarships Section -->
                                {#if match.relevant_scholarships && match.relevant_scholarships.length > 0}
                                    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <h5 class="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                            <span class="mr-2">🎓</span> Available Scholarships
                                        </h5>
                                        <ul class="text-xs text-blue-700 space-y-2">
                                            {#each match.relevant_scholarships as scholarship}
                                                <li class="p-2 bg-white rounded border border-blue-100">
                                                    <a href={scholarship.id ? `/scholarships/${scholarship.id}` : '#'} class="block hover:text-blue-600">
                                                        <div class="font-medium">{scholarship.title}</div>
                                                    </a>
                                                    <div class="flex justify-between items-center mt-1">
                                                        <span>Provider: {scholarship.provider}</span>
                                                        <span class="font-medium">{scholarship.amount}</span>
                                            </div>
                                                    <div class="flex justify-between items-center mt-1 text-gray-600">
                                                        <span>Deadline: {new Date(scholarship.deadline).toLocaleDateString()}</span>
                                                        <span class="bg-blue-100 px-2 py-0.5 rounded text-blue-800">{scholarship.match_score}% Match</span>
                                        </div>
                                                    <div class="mt-1 text-gray-700">
                                                        <span class="italic">{scholarship.why_relevant}</span>
                                            </div>
                                                </li>
                                            {/each}
                                        </ul>
                                        
                                        {#if match.funding_analysis}
                                            <div class="mt-3 p-2 bg-white rounded border border-blue-100">
                                                <div class="font-medium text-blue-800">Funding Analysis</div>
                                                <div class="grid grid-cols-2 gap-2 mt-1">
                                                    <div>Original Cost: {formatCurrency(match.funding_analysis.original_cost)}</div>
                                                    <div>Potential Aid: {formatCurrency(match.funding_analysis.potential_aid)}</div>
                                                    <div>Final Cost: {formatCurrency(match.funding_analysis.estimated_final_cost)}</div>
                                                    <div>Affordability: <span class={getAffordabilityColor(match.funding_analysis.affordability_rating)}>{match.funding_analysis.affordability_rating}</span></div>
                                    </div>
                                                <div class="mt-2 text-xs text-gray-700">
                                                    <span class="font-medium">Strategy:</span> {match.funding_analysis.funding_strategy}
                                    </div>
                                            </div>
                                        {/if}
                                </div>
                            {/if}

                                <!-- University Profile Link -->
                                <div class="text-right mt-4 pt-3 border-t border-gray-200">
                                    <a href="/universities/{match.university.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        🏫 View University Profile →
                                    </a>
                                                </div>
                                            </div>
                                        {/each}
                                </div>
                            {/if}

                <!-- Update the pagination controls to be more robust -->
                {#if matchResults && matchResults.pagination && matchResults.pagination.totalPages > 1}
                    <div class="pagination flex justify-center mt-8 space-x-2">
                        <!-- Previous button -->
                        <button 
                            class="px-3 py-1 rounded border {currentPage === 1 || loadingPage ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
                            disabled={currentPage === 1 || loadingPage}
                            on:click={handlePrevPage}
                            aria-label="Previous page"
                        >
                            <span class="sr-only">Previous page</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <!-- Page buttons -->
                        <div class="flex space-x-1">
                            {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                const start = Math.max(1, currentPage - 2);
                                const end = Math.min(totalPages, start + 4);
                                return i + start <= end ? i + start : null;
                            }).filter(p => p !== null) as page}
                                <button
                                    class="w-8 h-8 rounded-full {page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'} {loadingPage ? 'cursor-not-allowed opacity-50' : ''}"
                                    on:click={() => handlePageClick(page)}
                                    disabled={loadingPage}
                                >
                                    {page}
                                </button>
                                        {/each}
                                    </div>
                        
                        <!-- Next button -->
                        <button
                            class="px-3 py-1 rounded border {currentPage === totalPages || loadingPage ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
                            disabled={currentPage === totalPages || loadingPage}
                            on:click={handleNextPage}
                            aria-label="Next page"
                        >
                            <span class="sr-only">Next page</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="text-center text-sm text-gray-600 mt-2">
                        Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalMatches)} 
                        of {totalMatches} universities available on your {planType} plan
                                </div>
                            {/if}
                        </div>

            <!-- Upgrade CTA for non-elite users -->
            {#if planType !== 'elite' && planLimit < totalAvailable}
                {@const upgrade = getUpgradePlan()}
                {#if upgrade}
                    <div class="mt-10 pt-6 border-t border-gray-200">
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-center">
                            <h3 class="text-lg font-bold text-blue-900 mb-2">
                                🔍 Unlock {planType === 'free' ? '450' : '1000+'} More University Matches!
                            </h3>
                            
                            <p class="mb-4 text-blue-800">
                                You're viewing {planLimit} universities on the {planType} plan. 
                                Upgrade to see {planType === 'free' ? '10x' : '3x'} more options!
                            </p>
                            
                            <a 
                                href="/pricing" 
                                class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-300"
                            >
                                {upgrade.cta}
                            </a>
                </div>
            </div>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .university-matcher {
        max-width: 100%;
    }

    .profile-form input, .profile-form select, .profile-form textarea {
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .profile-form input:focus, .profile-form select:focus, .profile-form textarea:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .university-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
    }

    .university-card:hover {
        border-color: #cbd5e1;
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
    }

    .rank {
        font-family: 'Inter', sans-serif;
    }

    .advanced-options {
        animation: slideDown 0.3s ease-out;
    }

    .match-breakdown {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style> 