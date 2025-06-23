<!-- Universal AI Feature Widget -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { handleUpgradeRequired, markUserInteraction } from '$lib/services/upgradeService';
    import type { AIFeatureType } from '$lib/services/aiFeatureService';
    
    export let featureType: AIFeatureType;
    export let content: string = '';
    export let options: Record<string, any> = {};
    export let placeholder: string = 'Enter text to analyze...';
    export let buttonText: string = 'Process with AI';
    export let disabled: boolean = false;
    export let showUsageInfo: boolean = true;
    export let session: any = null;
    
    const dispatch = createEventDispatcher();
    
    let processing = false;
    let result: any = null;
    let error = '';
    let usageData: any = null;
    let userPlan: string = 'free';
    let hasCheckedUsage = false;
    let showLoginPrompt = false;
    
    // Feature configurations
    const config = {
        sop_review: {
            title: 'SOP Review',
            description: 'Get detailed feedback on your Statement of Purpose',
            icon: '📊',
            color: 'blue'
        },
        text_enhancement: {
            title: 'Text Enhancement',
            description: 'Improve writing clarity and impact',
            icon: '✨',
            color: 'purple'
        },
        word_optimization: {
            title: 'Word Optimization',
            description: 'Optimize text length while preserving meaning',
            icon: '📝',
            color: 'green'
        },
        grammar_check: {
            title: 'Grammar Check',
            description: 'Fix grammar and style issues',
            icon: '✅',
            color: 'red'
        },
        plagiarism_check: {
            title: 'Plagiarism Check',
            description: 'Check text originality',
            icon: '🔍',
            color: 'orange'
        },
        tone_analysis: {
            title: 'Tone Analysis',
            description: 'Analyze writing tone and style',
            icon: '🎭',
            color: 'indigo'
        }
    }[featureType] || {
        title: 'AI Processing',
        description: 'Process text with AI',
        icon: '🤖',
        color: 'gray'
    };
    
    // Check user plan on mount WITHOUT triggering usage limits
    onMount(async () => {
        await loadUserPlan();
    });
    
    async function loadUserPlan() {
        try {
            const response = await fetch('/api/get-user-profile');
            if (response.ok) {
                const data = await response.json();
                userPlan = data.subscription?.plan_type || 'free';
                console.log(`User plan detected: ${userPlan} for feature: ${featureType}`);
                
                // Set initial usage data for display purposes only (no limits checking)
                if (userPlan === 'elite') {
                    usageData = {
                        currentUsage: 0,
                        limit: 999999, // Show as unlimited
                        remainingUsage: 999999,
                        planType: 'elite'
                    };
                }
            }
        } catch (error) {
            console.error('Error loading user plan:', error);
            userPlan = 'free'; // Default to free on error
        }
    }
    
    // Parse plagiarism results for better display
    $: parsedPlagiarismResult = (() => {
        if (featureType === 'plagiarism_check' && typeof result === 'string') {
            try {
                return JSON.parse(result);
            } catch {
                return null;
            }
        }
        return null;
    })();
    
    // Parse grammar check results for better display
    $: parsedGrammarCheckResult = (() => {
        if (featureType === 'grammar_check' && result) {
            if (typeof result === 'string') {
                try {
                    return JSON.parse(result);
                } catch { return null; }
            }
            return result; // It might already be an object
        }
        return null;
    })();
    
    // Parse tone analysis results for better display
    $: parsedToneAnalysisResult = (() => {
        if (featureType === 'tone_analysis' && typeof result === 'string') {
            try {
                return JSON.parse(result);
            } catch {
                return null; // or return a default error object
            }
        }
        return null;
    })();
    
    // Map feature types to usage types for upgrade system
    function getUsageTypeFromFeature(feature: AIFeatureType): string {
        const mapping = {
            'sop_review': 'reviews',
            'text_enhancement': 'text_enhancements', 
            'word_optimization': 'word_optimizations',
            'grammar_check': 'grammar_check',
            'plagiarism_check': 'plagiarism_checks',
            'tone_analysis': 'tone_analysis'
        };
        return mapping[feature] || 'reviews';
    }
    
    // Function to trigger authentication modal
    function showAuthModal(mode = 'login') {
        dispatch('auth', { mode });
    }
    
    async function processWithAI() {
        if (!content.trim()) {
            error = 'Please enter some text to analyze';
            return;
        }
        
        // Check if user is logged in
        if (!session) {
            showLoginPrompt = true;
            return;
        }
        
        // Mark that user has interacted with the app
        markUserInteraction();
        hasCheckedUsage = true;
        
        processing = true;
        error = '';
        result = null;
        
        try {
            const response = await fetch('/api/ai-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: featureType,
                    content: content.trim(),
                    options
                })
            });
            
            const data = await response.json();
            
            // Debug logging for usage tracking
            console.log('AI Feature Response:', {
                featureType,
                userPlan,
                status: response.status,
                data,
                usageType: getUsageTypeFromFeature(featureType)
            });
            
            // Special handling for Elite plan - should never show upgrade prompts
            if (userPlan === 'elite' && response.status === 403) {
                console.error('Elite user hit usage limit - this should not happen!', data);
                error = 'System error: Elite plan should have unlimited access. Please contact support.';
                processing = false;
                return;
            }
            
            // Check for usage limit related messages for non-Elite users
            if (userPlan !== 'elite' && (
                data.error?.toLowerCase().includes('limit') || 
                data.message?.toLowerCase().includes('limit') ||
                data.error?.toLowerCase().includes('monthly') ||
                response.status === 403)) {
                
                // Use the upgrade system for non-Elite users only
                const upgradeData = {
                    upgradeRequired: true,
                    planType: data.usageData?.planType || userPlan,
                    currentUsage: data.usageData?.currentUsage || 0,
                    limit: data.usageData?.limit || 1,
                    message: data.error || data.message || 'Usage limit reached',
                    usageType: getUsageTypeFromFeature(featureType)
                };
                
                console.log('Triggering upgrade modal for non-Elite user:', upgradeData);
                handleUpgradeRequired(upgradeData);
                processing = false;
                return;
            }
            
            // For non-limit related errors
            if (!response.ok) {
                throw new Error(data.error || 'AI processing failed');
            }
            
            result = data.result;
            usageData = data.usageData;
            
            dispatch('success', { result, usageData });
            
        } catch (err: any) {
            error = err.message || 'Failed to process with AI';
            
            // Only trigger upgrade for non-Elite users with limit-related errors
            if (userPlan !== 'elite' && error.toLowerCase().includes('limit')) {
                handleUpgradeRequired({
                    upgradeRequired: true,
                    planType: userPlan,
                    currentUsage: usageData?.currentUsage || 0,
                    limit: usageData?.limit || 1,
                    message: error,
                    usageType: getUsageTypeFromFeature(featureType)
                });
                error = ''; // Clear the error since we're showing the upgrade modal
            } else {
                console.error('AI processing error:', err);
            }
        } finally {
            processing = false;
        }
    }
</script>

<div class="ai-feature-widget bg-white rounded-lg border border-gray-200 shadow-sm">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 rounded-t-lg {featureType === 'sop_review' ? 'bg-blue-50' : featureType === 'text_enhancement' ? 'bg-purple-50' : featureType === 'word_optimization' ? 'bg-green-50' : featureType === 'grammar_check' ? 'bg-red-50' : featureType === 'plagiarism_check' ? 'bg-orange-50' : featureType === 'tone_analysis' ? 'bg-indigo-50' : 'bg-gray-50'}">
        <div class="flex items-center gap-3">
            <div class="text-2xl">{config.icon}</div>
            <div>
                <h3 class="font-semibold text-lg {featureType === 'sop_review' ? 'text-blue-800' : featureType === 'text_enhancement' ? 'text-purple-800' : featureType === 'word_optimization' ? 'text-green-800' : featureType === 'grammar_check' ? 'text-red-800' : featureType === 'plagiarism_check' ? 'text-orange-800' : featureType === 'tone_analysis' ? 'text-indigo-800' : 'text-gray-800'}">{config.title}</h3>
                <p class="text-sm {featureType === 'sop_review' ? 'text-blue-600' : featureType === 'text_enhancement' ? 'text-purple-600' : featureType === 'word_optimization' ? 'text-green-600' : featureType === 'grammar_check' ? 'text-red-600' : featureType === 'plagiarism_check' ? 'text-orange-600' : featureType === 'tone_analysis' ? 'text-indigo-600' : 'text-gray-600'}">{config.description}</p>
            </div>
        </div>
        
        <!-- Usage Info - Only show after user interaction or for Elite users -->
        {#if showUsageInfo && (hasCheckedUsage || userPlan === 'elite') && usageData}
            <div class="mt-3 text-xs flex items-center gap-2 {featureType === 'sop_review' ? 'text-blue-600' : featureType === 'text_enhancement' ? 'text-purple-600' : featureType === 'word_optimization' ? 'text-green-600' : featureType === 'grammar_check' ? 'text-red-600' : featureType === 'plagiarism_check' ? 'text-orange-600' : featureType === 'tone_analysis' ? 'text-indigo-600' : 'text-gray-600'}">
                {#if userPlan === 'elite'}
                    <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                        👑 Elite Plan - Unlimited Usage
                    </span>
                {:else}
                    <span>Usage: {usageData.currentUsage}/{usageData.limit === 999999 ? '∞' : usageData.limit}</span>
                    {#if usageData.remainingUsage && usageData.remainingUsage < 999999}
                        <span class="px-2 py-1 rounded-full {featureType === 'sop_review' ? 'bg-blue-100' : featureType === 'text_enhancement' ? 'bg-purple-100' : featureType === 'word_optimization' ? 'bg-green-100' : featureType === 'grammar_check' ? 'bg-red-100' : featureType === 'plagiarism_check' ? 'bg-orange-100' : featureType === 'tone_analysis' ? 'bg-indigo-100' : 'bg-gray-100'}">
                            {usageData.remainingUsage} remaining
                        </span>
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
    
    <!-- Input Area -->
    <div class="p-4">
        <textarea
            bind:value={content}
            {placeholder}
            {disabled}
            rows="4"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none {featureType === 'sop_review' ? 'focus:ring-blue-500' : featureType === 'text_enhancement' ? 'focus:ring-purple-500' : featureType === 'word_optimization' ? 'focus:ring-green-500' : featureType === 'grammar_check' ? 'focus:ring-red-500' : featureType === 'plagiarism_check' ? 'focus:ring-orange-500' : featureType === 'tone_analysis' ? 'focus:ring-indigo-500' : 'focus:ring-gray-500'}"
        ></textarea>
        
        <!-- Options -->
        {#if featureType === 'text_enhancement'}
            <div class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Enhancement Type:</label>
                <select 
                    bind:value={options.enhancementType}
                    class="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                    <option value="concise">Make More Concise</option>
                    <option value="detailed">Add More Detail</option>
                    <option value="academic">More Academic</option>
                    <option value="professional">More Professional</option>
                </select>
            </div>
        {/if}
        
        {#if featureType === 'word_optimization'}
            <div class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Word Count:</label>
                <input 
                    type="number" 
                    bind:value={options.targetWordCount}
                    placeholder="e.g., 500"
                    class="border border-gray-300 rounded px-3 py-2 text-sm w-24"
                    min="50"
                    max="2000"
                />
            </div>
        {/if}
        
        <!-- Action Button -->
        <div class="mt-4">
            <button
                onclick={processWithAI}
                disabled={processing || disabled}
                class="w-full px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 {featureType === 'sop_review' ? 'bg-blue-600 hover:bg-blue-700' : featureType === 'text_enhancement' ? 'bg-purple-600 hover:bg-purple-700' : featureType === 'word_optimization' ? 'bg-green-600 hover:bg-green-700' : featureType === 'grammar_check' ? 'bg-red-600 hover:bg-red-700' : featureType === 'plagiarism_check' ? 'bg-orange-600 hover:bg-orange-700' : featureType === 'tone_analysis' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-700'}"
            >
                {#if processing}
                    <span class="animate-spin">🔄</span>
                    Processing...
                {:else}
                    {buttonText}
                {/if}
            </button>
            
            {#if error}
                <p class="mt-2 text-sm text-red-600">{error}</p>
            {/if}
            
            <!-- Login Prompt -->
            {#if showLoginPrompt}
                <div class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-slide-down">
                    <div class="flex items-start gap-3">
                        <div class="text-2xl">🔐</div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-blue-900 mb-2">Login Required</h4>
                            <p class="text-sm text-blue-800 mb-3">Sign in to use this AI feature and access your personalized dashboard.</p>
                            <div class="flex gap-2">
                                <button 
                                    onclick={() => showAuthModal('login')}
                                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Login
                                </button>
                                <button 
                                    onclick={() => showAuthModal('signup')}
                                    class="px-4 py-2 bg-white text-blue-600 border border-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Sign Up
                                </button>
                                <button 
                                    onclick={() => showLoginPrompt = false}
                                    class="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
        
        <!-- Results -->
        {#if result}
            <div class="mt-4 p-6 bg-gray-50/50 rounded-b-xl border-t border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span class="mr-3">{config.icon || '💡'}</span>
                    Analysis Result
                </h3>
                
                <div class="text-sm text-gray-700 space-y-4">
                {#if featureType === 'plagiarism_check' && parsedPlagiarismResult}
                        <div class="space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div class="flex justify-between items-center text-base">
                                <span class="font-semibold text-gray-800">Originality Score:</span>
                                <span class="font-bold text-2xl {parsedPlagiarismResult.originality_score > 90 ? 'text-green-600' : 'text-orange-600'}">
                                    {parsedPlagiarismResult.originality_score}%
                            </span>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-md">
                                <h4 class="font-medium text-gray-700 mb-1">Analyst's Note:</h4>
                                <p class="text-gray-600">{parsedPlagiarismResult.analysis}</p>
                            </div>
                        </div>
                    {:else if featureType === 'tone_analysis' && parsedToneAnalysisResult}
                        <div class="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                             <div>
                                <h4 class="font-medium text-gray-800 mb-2 text-base">Overall Tone</h4>
                                <div class="flex items-center gap-3">
                                    <span class="capitalize text-lg font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                        {parsedToneAnalysisResult.overall_tone}
                                    </span>
                                     <div class="w-full bg-gray-200 rounded-full h-2.5">
                                        <div class="bg-indigo-500 h-2.5 rounded-full" style="width: {parsedToneAnalysisResult.confidence_score * 100}%"></div>
                                    </div>
                                    <span class="text-sm font-medium text-gray-600">{(parsedToneAnalysisResult.confidence_score * 100).toFixed(0)}% Confident</span>
                                </div>
                            </div>

                            {#if parsedToneAnalysisResult.tone_breakdown}
                            <div>
                                <h4 class="font-medium text-gray-800 mb-2 text-base">Tone Breakdown</h4>
                                <div class="space-y-2">
                                    {#each Object.entries(parsedToneAnalysisResult.tone_breakdown) as [tone, score]}
                                    <div class="flex items-center gap-2">
                                        <span class="capitalize w-28 text-gray-600">{tone}</span>
                                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                                            <div class="bg-blue-500 h-2.5 rounded-full" style="width: {(score as number) * 100}%"></div>
                                        </div>
                                    </div>
                                    {/each}
                                </div>
                            </div>
                            {/if}
                            
                            {#if parsedToneAnalysisResult.suggestions && parsedToneAnalysisResult.suggestions.length > 0}
                            <div>
                                 <h4 class="font-medium text-gray-800 mb-2 text-base">Suggestions</h4>
                                 <ul class="list-disc list-inside space-y-1 text-gray-600 bg-gray-50 p-3 rounded-md">
                                    {#each parsedToneAnalysisResult.suggestions as suggestion}
                                        <li>{suggestion}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>
                    {:else if featureType === 'grammar_check' && parsedGrammarCheckResult}
                        <div class="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            {#if parsedGrammarCheckResult.corrected_text}
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2 text-base">Corrected Text</h4>
                                    <p class="p-3 bg-green-50 rounded-md text-gray-800 whitespace-pre-wrap">{parsedGrammarCheckResult.corrected_text}</p>
                            </div>
                        {/if}
                            {#if parsedGrammarCheckResult.issues && parsedGrammarCheckResult.issues.length > 0}
                            <div>
                                    <h4 class="font-medium text-gray-800 mb-2 text-base">Issues Found</h4>
                                <ul class="space-y-2">
                                        {#each parsedGrammarCheckResult.issues as issue}
                                            <li class="p-3 border rounded-md bg-gray-50/50">
                                                <p class="text-sm">
                                                    <span class="line-through text-red-500">{issue.original}</span>
                                                    <span class="mx-2 font-bold text-gray-600">→</span>
                                                    <span class="text-green-600 font-semibold">{issue.correction}</span>
                                                </p>
                                                {#if issue.explanation}
                                                    <p class="text-xs text-gray-500 mt-1">{issue.explanation}</p>
                                                    {/if}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                        </div>
                    {:else if featureType === 'sop_review' && result.overallAnalysis}
                        <div class="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <!-- Overall Analysis Section -->
                                        <div>
                                <h4 class="font-medium text-gray-800 mb-2 text-base">Overall Analysis</h4>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm p-3 bg-gray-50 rounded-md">
                                    {#each Object.entries(result.overallAnalysis) as [key, value]}
                                        <div class="flex flex-col">
                                            <span class="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                            {#if Array.isArray(value)}
                                                <ul class="list-disc list-inside mt-1">
                                                {#each value as item}
                                                    <li class="text-xs">{item}</li>
                                                {/each}
                                                </ul>
                                            {:else}
                                                <span class="font-medium text-gray-900">{value}</span>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <!-- Paragraph Analysis Section -->
                            {#if result.paragraphAnalyses && result.paragraphAnalyses.length > 0}
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2 text-base">Paragraph-by-Paragraph Feedback</h4>
                                    <div class="space-y-3">
                                        {#each result.paragraphAnalyses as p, i}
                                            <div class="p-3 border border-gray-200 rounded-md bg-white">
                                                <p class="italic text-gray-600">"{p.originalText}"</p>
                                                <div class="mt-2 text-xs">
                                                    {#if p.strengths.length > 0}<p class="text-green-600"><b>Strengths:</b> {p.strengths.join(', ')}</p>{/if}
                                                    {#if p.weaknesses.length > 0}<p class="text-orange-600"><b>Weaknesses:</b> {p.weaknesses.join(', ')}</p>{/if}
                                                    {#if p.suggestions.length > 0}<p class="text-blue-600"><b>Suggestions:</b> {p.suggestions.join(', ')}</p>{/if}
                                                </div>
                                                {#if p.improvedText}
                                                    <div class="mt-2 p-2 bg-green-50/50 rounded">
                                                        <p class="font-semibold text-green-800 text-xs">Improved version:</p>
                                                        <p class="text-sm text-gray-800">{p.improvedText}</p>
                                                    </div>
                                                {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else if typeof result === 'string'}
                         <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h4 class="font-medium text-gray-800 mb-2 text-base">Result</h4>
                            <div class="prose prose-sm max-w-none whitespace-pre-wrap">{result}</div>
                    </div>
                {:else}
                         <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                             <h4 class="font-medium text-gray-800 mb-2 text-base">Result</h4>
                             <pre class="whitespace-pre-wrap text-xs"><code>{JSON.stringify(result, null, 2)}</code></pre>
                    </div>
                {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .ai-feature-widget {
        transition: all 0.2s ease-in-out;
    }
    
    .ai-feature-widget:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    .animate-slide-down {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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