<!-- Universal AI Feature Widget -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { handleUpgradeRequired, markUserInteraction } from '$lib/services/upgradeService';
    import type { AIFeatureType } from '$lib/services/aiFeatureService';
    
    export let featureType: AIFeatureType;
    export let content: string = '';
    export let options: Record<string, any> = {};
    export let placeholder: string = 'Enter text to analyze...';
    export let buttonText: string = 'Process with AI';
    export let disabled: boolean = false;
    export let showUsageInfo: boolean = true;
    
    const dispatch = createEventDispatcher();
    
    let processing = false;
    let result: any = null;
    let error = '';
    let usageData: any = null;
    
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
            'sop_review': 'ai_improvements',
            'text_enhancement': 'ai_improvements', 
            'word_optimization': 'ai_improvements',
            'grammar_check': 'ai_improvements',
            'plagiarism_check': 'plagiarism_checks',
            'tone_analysis': 'ai_improvements'
        };
        return mapping[feature] || 'ai_improvements';
    }
    
    async function processWithAI() {
        if (!content.trim()) {
            error = 'Please enter some text to analyze';
            return;
        }
        
        // Mark that user has interacted with the app
        markUserInteraction();
        
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
                status: response.status,
                data,
                usageType: getUsageTypeFromFeature(featureType)
            });
            
            // Check for any usage limit related messages first
            if (data.error?.toLowerCase().includes('limit') || 
                data.message?.toLowerCase().includes('limit') ||
                data.error?.toLowerCase().includes('monthly') ||
                response.status === 403) {
                
                // Use the new upgrade system
                const upgradeData = {
                    upgradeRequired: true,
                    planType: data.usageData?.planType || 'free',
                    currentUsage: data.usageData?.currentUsage || 0,
                    limit: data.usageData?.limit || 1,
                    message: data.error || data.message || 'Usage limit reached',
                    usageType: getUsageTypeFromFeature(featureType)
                };
                
                console.log('Triggering upgrade modal with:', upgradeData);
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
            if (error.toLowerCase().includes('limit')) {
                // Double-check for limit messages in errors
                handleUpgradeRequired({
                    upgradeRequired: true,
                    planType: 'free',
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
    <div class="p-4 border-b border-gray-200 bg-{config.color}-50 rounded-t-lg">
        <div class="flex items-center gap-3">
            <div class="text-2xl">{config.icon}</div>
            <div>
                <h3 class="font-semibold text-lg text-{config.color}-800">{config.title}</h3>
                <p class="text-sm text-{config.color}-600">{config.description}</p>
            </div>
        </div>
        
        <!-- Usage Info -->
        {#if showUsageInfo && usageData}
            <div class="mt-3 text-xs text-{config.color}-600 flex items-center gap-2">
                <span>Usage: {usageData.currentUsage}/{usageData.limit === 999999 ? '∞' : usageData.limit}</span>
                {#if usageData.remainingUsage && usageData.remainingUsage < 999999}
                    <span class="px-2 py-1 bg-{config.color}-100 rounded-full">
                        {usageData.remainingUsage} remaining
                    </span>
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
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-{config.color}-500 focus:border-transparent resize-none"
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
                on:click={processWithAI}
                disabled={processing || disabled}
                class="w-full px-4 py-2 bg-{config.color}-600 text-white rounded-lg hover:bg-{config.color}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
        </div>
        
        <!-- Results -->
        {#if result}
            <div class="mt-4 p-6 bg-gray-50/50 rounded-b-xl border-t border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span class="mr-3">{config[featureType]?.icon || '💡'}</span>
                    Analysis Result
                </h3>
                
                <div class="text-sm text-gray-700 space-y-4">
                {#if featureType === 'plagiarism_check' && parsedPlagiarismResult}
                        <div class="space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div class="flex justify-between items-center text-base">
                                <span class="font-semibold text-gray-800">Originality Score:</span>
                                <span class="font-bold text-2xl text-{parsedPlagiarismResult.originality_score > 90 ? 'green' : 'orange'}-600">
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
                                            <div class="bg-blue-500 h-2.5 rounded-full" style="width: {score * 100}%"></div>
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
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style> 