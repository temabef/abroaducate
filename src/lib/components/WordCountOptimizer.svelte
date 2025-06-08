<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
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
    
    $: if (sopContent) {
        currentWordCount = sopContent.split(/\s+/).filter(w => w.length > 0).length;
    }
    
    async function analyzeWordCount() {
        analyzing = true;
        error = '';
        
        try {
            const response = await fetch('/api/optimize-word-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: sopContent,
                    university_name: universityName,
                    program_name: programName,
                    program_type: programType,
                    optimization_type: 'analyze'
                })
            });
            
            if (!response.ok) throw new Error('Analysis failed');
            
            optimizationResult = await response.json();
            
        } catch (err) {
            error = 'Failed to analyze word count';
        } finally {
            analyzing = false;
        }
    }
    
    async function optimizeContent() {
        optimizing = true;
        
        try {
            const response = await fetch('/api/optimize-word-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: sopContent,
                    university_name: universityName,
                    program_name: programName,
                    program_type: programType,
                    optimization_type: 'optimize'
                })
            });
            
            if (!response.ok) throw new Error('Optimization failed');
            
            const result = await response.json();
            
            if (result.optimized_content) {
                dispatch('contentOptimized', {
                    optimizedContent: result.optimized_content,
                    originalWordCount: currentWordCount,
                    newWordCount: result.optimized_content.split(/\s+/).length
                });
            }
            
        } catch (err) {
            error = 'Failed to optimize content';
        } finally {
            optimizing = false;
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
            <h3 class="text-lg font-semibold">Word Count Optimization</h3>
            <p class="text-sm text-gray-500">Optimize your SOP length for university requirements</p>
        </div>
        <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">{currentWordCount}</div>
            <div class="text-sm text-gray-500">words</div>
        </div>
    </div>
    
    {#if optimizationResult}
        <div class="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div class="font-semibold mb-2">
                Status: {optimizationResult.optimization_needed}
            </div>
            <div class="text-sm">
                Requirements: {optimizationResult.university_requirements.min} - {optimizationResult.university_requirements.max} words
                (Optimal: {optimizationResult.university_requirements.optimal})
            </div>
        </div>
    {/if}
    
    <div class="flex gap-3 mb-4">
        <button
            on:click={analyzeWordCount}
            disabled={analyzing || !sopContent}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
            {analyzing ? 'Analyzing...' : 'Analyze Word Count'}
        </button>
        
        {#if optimizationResult && optimizationResult.optimization_needed !== 'optimal'}
            <button
                on:click={optimizeContent}
                disabled={optimizing}
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
                {optimizing ? 'Optimizing...' : 'Auto-Optimize'}
            </button>
        {/if}
    </div>
    
    {#if error}
        <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4">
            {error}
        </div>
    {/if}
    
    {#if optimizationResult && optimizationResult.suggested_optimizations.length > 0}
        <div class="border-t pt-4">
            <h4 class="font-semibold mb-3">Suggestions</h4>
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