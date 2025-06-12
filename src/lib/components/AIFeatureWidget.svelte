<!-- Universal AI Feature Widget -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
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
    const featureConfig = {
        sop_review: {
            icon: '📊',
            title: 'SOP Review',
            description: 'Get detailed feedback on your Statement of Purpose',
            color: 'blue'
        },
        text_enhancement: {
            icon: '✨',
            title: 'Text Enhancement',
            description: 'Improve your writing with AI suggestions',
            color: 'purple'
        },
        word_optimization: {
            icon: '📝',
            title: 'Word Count Optimization',
            description: 'Adjust your text to meet word count requirements',
            color: 'green'
        },
        grammar_check: {
            icon: '✅',
            title: 'Grammar Check',
            description: 'Check for grammar and style issues',
            color: 'red'
        },
        plagiarism_check: {
            icon: '🔍',
            title: 'Plagiarism Check',
            description: 'Analyze originality and detect potential issues',
            color: 'orange'
        },
        tone_analysis: {
            icon: '🎭',
            title: 'Tone Analysis',
            description: 'Analyze the tone and style of your writing',
            color: 'indigo'
        }
    };
    
    $: config = featureConfig[featureType];
    
    async function processWithAI() {
        if (!content.trim()) {
            error = 'Please enter some text to analyze';
            return;
        }
        
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
            
            if (!response.ok) {
                if (response.status === 403 && data.upgradeRequired) {
                    error = data.error;
                    usageData = data.usageData;
                    return;
                }
                throw new Error(data.error || 'AI processing failed');
            }
            
            result = data.result;
            usageData = data.usageData;
            
            dispatch('success', { result, usageData });
            
        } catch (err: any) {
            error = err.message || 'Failed to process with AI';
            console.error('AI processing error:', err);
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
            <div class="mt-3 text-xs text-{config.color}-600">
                Usage: {usageData.currentUsage}/{usageData.limit === 999999 ? '∞' : usageData.limit}
                {#if usageData.remainingUsage && usageData.remainingUsage < 999999}
                    ({usageData.remainingUsage} remaining)
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
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
        <div class="mt-4 flex gap-3 items-center">
            <button
                on:click={processWithAI}
                disabled={processing || disabled || !content.trim()}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
                {#if processing}
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                {:else}
                    {config.icon} {buttonText}
                {/if}
            </button>
            
            <div class="text-xs text-gray-500">
                Words: {content.split(/\s+/).filter(w => w.length > 0).length}
            </div>
        </div>
        
        <!-- Error Display -->
        {#if error}
            <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
                {#if error.includes('limit')}
                    <button 
                        class="underline ml-2 text-red-800 font-medium"
                        on:click={() => window.location.href = '/pricing'}
                    >
                        Upgrade Now
                    </button>
                {/if}
            </div>
        {/if}
    </div>
    
    <!-- Results Display -->
    {#if result}
        <div class="border-t border-gray-200 p-4 bg-gray-50">
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium text-gray-900">AI Results</h4>
            </div>
            
            <div class="bg-white rounded-lg p-4 border border-gray-200">
                {#if typeof result === 'string'}
                    <div class="prose prose-sm max-w-none whitespace-pre-line">
                        {result}
                    </div>
                {:else}
                    <pre class="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                {/if}
            </div>
        </div>
    {/if}
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