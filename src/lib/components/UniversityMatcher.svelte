<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let userProfile: any = {};
    
    const dispatch = createEventDispatcher();
    
    let analyzing = false;
    let matchResults: any = null;
    let error = '';
    let showAdvancedForm = false;
    let profileForm = {
        gpa: '',
        field: '',
        degree_level: 'masters',
        qualities: [],
        budget_preference: 'moderate',
        research_interest: '',
        preferred_countries: []
    };

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
        'Switzerland',
        'Singapore',
        'Netherlands',
        'Sweden'
    ];

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

    async function analyzeMatches() {
        analyzing = true;
        error = '';
        
        try {
            const response = await fetch('/api/university-matching', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm)
            });
            
            if (!response.ok) throw new Error('Matching failed');
            
            matchResults = await response.json();
            
        } catch (err) {
            error = 'Failed to analyze university matches. Please try again.';
        } finally {
            analyzing = false;
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
                    Budget Preference
                </label>
                <select 
                    bind:value={profileForm.budget_preference}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {#each budgetOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
        </div>

        {#if showAdvancedForm}
            <div class="advanced-options space-y-4 p-4 bg-gray-50 rounded-lg border">
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
                                <span>{country}</span>
                            </label>
                        {/each}
                    </div>
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
            <!-- Enhanced Summary -->
            <div class="summary bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                    📊 Analysis Summary
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{matchResults.matches.length}</div>
                        <div class="text-gray-600">Total Matches</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">{matchResults.matches.filter(m => m.match_score >= 80).length}</div>
                        <div class="text-gray-600">Excellent Matches</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">{matchResults.matches.filter(m => m.admission_probability === 'High').length}</div>
                        <div class="text-gray-600">High Probability</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600">{matchResults.matches.filter(m => m.estimated_cost_fit === 'Excellent' || m.estimated_cost_fit === 'Good').length}</div>
                        <div class="text-gray-600">Budget Friendly</div>
                    </div>
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
                <div class="space-y-6">
                    {#each matchResults.matches as match, index}
                        <div class="match-card border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                            <!-- Header -->
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-3 mb-2">
                                        <span class="rank text-xl font-bold text-gray-500">#{index + 1}</span>
                                        <h5 class="text-xl font-semibold text-gray-900">{match.university.name}</h5>
                                        <span class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{match.university.country}</span>
                                    </div>
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
                                    <div class={`match-score px-3 py-2 rounded-full text-sm font-medium border ${getMatchColor(match.match_score)}`}>
                                        {match.match_score}% Match
                                    </div>
                                    <div class={`px-2 py-1 rounded text-xs font-medium ${getProbabilityColor(match.admission_probability)}`}>
                                        {match.admission_probability} Chance
                                    </div>
                                    <div class={`px-2 py-1 rounded text-xs font-medium ${getCostFitColor(match.estimated_cost_fit)}`}>
                                        {match.estimated_cost_fit}
                                    </div>
                                </div>
                            </div>

                            <!-- Match Breakdown -->
                            {#if match.match_breakdown}
                                <div class="match-breakdown bg-gray-50 p-4 rounded-lg mb-4">
                                    <h6 class="text-sm font-medium text-gray-700 mb-3">🎯 Compatibility Breakdown</h6>
                                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                                        <div class="text-center">
                                            <div class={`text-lg font-bold ${getBreakdownColor(match.match_breakdown.academic_fit)}`}>
                                                {Math.round(match.match_breakdown.academic_fit)}
                                            </div>
                                            <div class="text-gray-600">Academic Fit</div>
                                        </div>
                                        <div class="text-center">
                                            <div class={`text-lg font-bold ${getBreakdownColor(match.match_breakdown.program_strength)}`}>
                                                {Math.round(match.match_breakdown.program_strength)}
                                            </div>
                                            <div class="text-gray-600">Program</div>
                                        </div>
                                        <div class="text-center">
                                            <div class={`text-lg font-bold ${getBreakdownColor(match.match_breakdown.preference_alignment)}`}>
                                                {Math.round(match.match_breakdown.preference_alignment)}
                                            </div>
                                            <div class="text-gray-600">Preferences</div>
                                        </div>
                                        <div class="text-center">
                                            <div class={`text-lg font-bold ${getBreakdownColor(match.match_breakdown.geographic_fit)}`}>
                                                {Math.round(match.match_breakdown.geographic_fit)}
                                            </div>
                                            <div class="text-gray-600">Location</div>
                                        </div>
                                        <div class="text-center">
                                            <div class={`text-lg font-bold ${getBreakdownColor(match.match_breakdown.financial_feasibility)}`}>
                                                {Math.round(match.match_breakdown.financial_feasibility)}
                                            </div>
                                            <div class="text-gray-600">Financial</div>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            <!-- Strengths, Concerns, and Suggestions -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {#if match.strengths && match.strengths.length > 0}
                                    <div>
                                        <h6 class="text-sm font-medium text-green-700 mb-2 flex items-center">
                                            ✅ Strengths
                                        </h6>
                                        <ul class="text-xs text-green-600 space-y-1">
                                            {#each match.strengths as strength}
                                                <li class="flex items-start">
                                                    <span class="mr-1">•</span>
                                                    {strength}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}

                                {#if match.concerns && match.concerns.length > 0}
                                    <div>
                                        <h6 class="text-sm font-medium text-red-700 mb-2 flex items-center">
                                            ⚠️ Concerns
                                        </h6>
                                        <ul class="text-xs text-red-600 space-y-1">
                                            {#each match.concerns as concern}
                                                <li class="flex items-start">
                                                    <span class="mr-1">•</span>
                                                    {concern}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}

                                {#if match.improvement_suggestions && match.improvement_suggestions.length > 0}
                                    <div>
                                        <h6 class="text-sm font-medium text-blue-700 mb-2 flex items-center">
                                            💡 Tips
                                        </h6>
                                        <ul class="text-xs text-blue-600 space-y-1">
                                            {#each match.improvement_suggestions as suggestion}
                                                <li class="flex items-start">
                                                    <span class="mr-1">•</span>
                                                    {suggestion}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}
                            </div>

                            <!-- University Strengths -->
                            {#if match.university.strengths}
                                <div class="pt-4 border-t">
                                    <h6 class="text-sm font-medium text-gray-700 mb-2">🏆 University Excellence Areas</h6>
                                    <div class="flex flex-wrap gap-2">
                                        {#each match.university.strengths as strength}
                                            <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                {strength.replace('-', ' ')}
                                            </span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
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

    .match-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
    }

    .match-card:hover {
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