<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    export let sopContent: string = '';
    export let universityName: string = '';
    export let programName: string = '';
    export let programType: string = 'masters';
    export let currentWordCount: number = 0;
    
    const dispatch = createEventDispatcher();
    
    let analyzing = false;
    let optimizing = false;
    let optimizationResult: any = null;
    let error = '';
    let targetWordCount = 500; // Default target
    
    $: if (sopContent) {
        currentWordCount = sopContent.split(/\s+/).filter(w => w.length > 0).length;
    }
    
    // Handle AI optimization result from new unified system
    function handleOptimizationSuccess(event: CustomEvent) {
        const { result } = event.detail;
        
        // If it's a string result, treat it as optimized content
        if (typeof result === 'string') {
            dispatch('contentOptimized', {
                optimizedContent: result,
                originalWordCount: currentWordCount,
                newWordCount: result.split(/\s+/).filter(w => w.length > 0).length
            });
        } else {
            // If it's an object, extract the content
            optimizationResult = result;
            if (result.optimized_content) {
                dispatch('contentOptimized', {
                    optimizedContent: result.optimized_content,
                    originalWordCount: currentWordCount,
                    newWordCount: result.optimized_content.split(/\s+/).filter((w: string) => w.length > 0).length
                });
            }
        }
    }
    
    function getOptimizationColor(type: string) {
        switch (type) {
            case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
            case 'expand': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'condense': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'minor_adjust': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    }
    
    function getPriorityColor(priority: string) {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    }
    
    function getWordCountStatus() {
        if (!optimizationResult) return 'unknown';
        
        const { min, max, optimal } = optimizationResult.university_requirements;
        
        if (currentWordCount < min) return 'below';
        if (currentWordCount > max) return 'above';
        if (Math.abs(currentWordCount - optimal) <= optimal * 0.05) return 'optimal';
        if (currentWordCount < optimal) return 'below_optimal';
        return 'above_optimal';
    }
    
    function getStatusColor() {
        const status = getWordCountStatus();
        switch (status) {
            case 'optimal': return 'text-green-600';
            case 'below_optimal': case 'above_optimal': return 'text-yellow-600';
            case 'below': case 'above': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }
</script>

<div class="word-count-optimizer bg-white rounded-lg border p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
        <div>
            <h3 class="text-lg font-semibold">📝 Word Count Optimization</h3>
            <p class="text-sm text-gray-500">Optimize your content length for specific requirements</p>
        </div>
        <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">{currentWordCount}</div>
            <div class="text-sm text-gray-500">current words</div>
        </div>
    </div>
    
    <!-- Target Word Count Input -->
    <div class="mb-4">
        <label for="target-word-count" class="block text-sm font-medium text-gray-700 mb-2">Target Word Count:</label>
        <input
            id="target-word-count" 
            type="number" 
            bind:value={targetWordCount}
            placeholder="e.g., 500"
            class="border border-gray-300 rounded px-3 py-2 text-sm w-32"
            min="50"
            max="2000"
        />
    </div>
    
    <!-- AI Word Optimization Widget -->
    <AIFeatureWidget 
        featureType="word_optimization"
        content={sopContent}
        options={{ 
            targetWordCount: targetWordCount,
            universityName: universityName,
            programName: programName
        }}
        placeholder="Enter your content to optimize word count..."
        buttonText="📝 Optimize Word Count"
        disabled={sopContent.trim().length === 0}
        on:success={handleOptimizationSuccess}
    />
    
    {#if optimizationResult && optimizationResult.university_requirements}
        <div class="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div class="font-semibold mb-2">
                Status: {optimizationResult.optimization_needed}
            </div>
            <div class="text-sm">
                Requirements: {optimizationResult.university_requirements.min} - {optimizationResult.university_requirements.max} words
                (Optimal: {optimizationResult.university_requirements.optimal})
            </div>
        </div>
    {/if}
    
    {#if optimizationResult && optimizationResult.suggested_optimizations && optimizationResult.suggested_optimizations.length > 0}
        <div class="border-t pt-4 mt-4">
            <h4 class="font-semibold mb-3">📋 Optimization Suggestions</h4>
            <div class="space-y-2">
                {#each optimizationResult.suggested_optimizations as suggestion}
                    <div class="p-3 bg-gray-50 rounded">
                        <div class="font-medium">{suggestion.section}</div>
                        <div class="text-sm text-gray-600">{suggestion.strategy}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .word-count-optimizer {
        transition: all 0.3s ease;
    }
    
    .word-count-optimizer:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
</style> 