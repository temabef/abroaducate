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
        'entrepreneurship'
    ];

    const countries = [
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France'
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
            error = 'Failed to analyze university matches';
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
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    }

    function getProbabilityColor(probability: string): string {
        switch (probability) {
            case 'High': return 'text-green-600 bg-green-100';
            case 'Moderate': return 'text-blue-600 bg-blue-100';
            case 'Low': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
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
            <h3 class="text-xl font-bold text-gray-900">🎯 University Matching System</h3>
            <button 
                class="text-sm text-blue-600 hover:text-blue-700"
                on:click={() => showAdvancedForm = !showAdvancedForm}
            >
                {showAdvancedForm ? 'Hide' : 'Show'} Advanced Options
            </button>
        </div>
        <p class="text-gray-600 text-sm">
            Get personalized university recommendations based on your academic profile and preferences.
        </p>
    </div>

    <!-- Profile Form -->
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
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study <span class="text-red-500">*</span>
                </label>
                <input 
                    type="text"
                    bind:value={profileForm.field}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Computer Science"
                    required
                >
            </div>
        </div>

        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Degree Level
            </label>
            <select 
                bind:value={profileForm.degree_level}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="undergraduate">Undergraduate</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
            </select>
        </div>

        {#if showAdvancedForm}
            <div class="advanced-options space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        What do you value in a university? (Select up to 4)
                    </label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {#each availableQualities as quality}
                            <label class="flex items-center space-x-2 text-sm">
                                <input 
                                    type="checkbox" 
                                    checked={profileForm.qualities.includes(quality)}
                                    on:change={() => toggleQuality(quality)}
                                    disabled={!profileForm.qualities.includes(quality) && profileForm.qualities.length >= 4}
                                    class="rounded"
                                >
                                <span class="capitalize">{quality.replace('-', ' ')}</span>
                            </label>
                        {/each}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Countries (Optional)
                    </label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {#each countries as country}
                            <label class="flex items-center space-x-2 text-sm">
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
                        Research Interest (Optional)
                    </label>
                    <textarea 
                        bind:value={profileForm.research_interest}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your research interests..."
                        rows="2"
                    ></textarea>
                </div>
            </div>
        {/if}
    </div>

    <!-- Action Button -->
    <div class="mb-6">
        <button 
            on:click={analyzeMatches}
            disabled={analyzing || !profileForm.gpa || !profileForm.field}
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
            {analyzing ? 'Analyzing...' : 'Find University Matches'}
        </button>
    </div>

    <!-- Error Display -->
    {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
        </div>
    {/if}

    <!-- Results -->
    {#if matchResults}
        <div class="results space-y-6">
            <!-- Summary -->
            <div class="summary bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-900 mb-2">📊 Analysis Summary</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">Total Matches:</span>
                        <span class="font-medium ml-2">{matchResults.matches.length}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Top Matches:</span>
                        <span class="font-medium ml-2">{matchResults.matches.filter(m => m.match_score >= 80).length}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">High Probability:</span>
                        <span class="font-medium ml-2">{matchResults.matches.filter(m => m.admission_probability === 'High').length}</span>
                    </div>
                </div>
            </div>

            <!-- Recommendations -->
            {#if matchResults.recommendations && matchResults.recommendations.length > 0}
                <div class="recommendations bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 class="font-semibold text-green-900 mb-2">💡 Key Recommendations</h4>
                    <ul class="space-y-1 text-sm text-green-800">
                        {#each matchResults.recommendations as recommendation}
                            <li>• {recommendation}</li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <!-- University Matches -->
            <div class="matches">
                <h4 class="font-semibold text-gray-900 mb-4">🏛️ University Matches</h4>
                <div class="space-y-4">
                    {#each matchResults.matches as match, index}
                        <div class="match-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-3 mb-2">
                                        <span class="rank text-lg font-bold text-gray-500">#{index + 1}</span>
                                        <h5 class="text-lg font-semibold text-gray-900">{match.university.name}</h5>
                                        <span class="text-sm text-gray-600">{match.university.country}</span>
                                    </div>
                                    <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                        <span>Ranking: #{match.university.ranking}</span>
                                        <span>Acceptance: {match.university.acceptance_rate}%</span>
                                        <span>Cost: {formatCurrency(match.university.cost)}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class={`match-score px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(match.match_score)}`}>
                                        {match.match_score}% Match
                                    </div>
                                    <div class={`mt-2 px-2 py-1 rounded text-xs font-medium ${getProbabilityColor(match.admission_probability)}`}>
                                        {match.admission_probability} Chance
                                    </div>
                                </div>
                            </div>

                            <!-- Strengths and Concerns -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {#if match.strengths && match.strengths.length > 0}
                                    <div>
                                        <h6 class="text-sm font-medium text-green-700 mb-1">✅ Strengths</h6>
                                        <ul class="text-xs text-green-600 space-y-1">
                                            {#each match.strengths as strength}
                                                <li>• {strength}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}

                                {#if match.concerns && match.concerns.length > 0}
                                    <div>
                                        <h6 class="text-sm font-medium text-red-700 mb-1">⚠️ Concerns</h6>
                                        <ul class="text-xs text-red-600 space-y-1">
                                            {#each match.concerns as concern}
                                                <li>• {concern}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}
                            </div>

                            <!-- University Strengths -->
                            {#if match.university.strengths}
                                <div class="mt-3 pt-3 border-t">
                                    <h6 class="text-sm font-medium text-gray-700 mb-1">🏆 University Strengths</h6>
                                    <div class="flex flex-wrap gap-1">
                                        {#each match.university.strengths as strength}
                                            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
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
    }

    .rank {
        font-family: 'Inter', sans-serif;
    }

    .advanced-options {
        animation: slideDown 0.3s ease-out;
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