<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    export let isVisible = false;
    export let limitType = 'documents';
    export let featureType = '';
    export let currentUsage = 0;
    export let limit = 0;
    export const planType = 'free';
    
    const dispatch = createEventDispatcher();
    
    // Calculate percentage used
    $: percentageUsed = Math.round((currentUsage / limit) * 100);
    $: isNearLimit = percentageUsed >= 80;
    $: isAtLimit = currentUsage >= limit;
    
    // Toast messages based on usage
    $: toastConfig = getToastConfig(limitType as 'documents' | 'ai_features', featureType, percentageUsed, isAtLimit);
    
    function getToastConfig(
        limitType: 'documents' | 'ai_features',
        featureType: string,
        percentageUsed: number,
        isAtLimit: boolean
    ) {
        const baseConfig = {
            documents: {
                sop: {
                    icon: '📄',
                    feature: 'SOPs',
                    near: `${percentageUsed}% of your SOPs used. Only ${limit - currentUsage} left!`,
                    at: 'SOP limit reached! Upgrade for 50 documents/month.',
                    color: 'blue'
                },
                academic_cv: {
                    icon: '🎓',
                    feature: 'Academic CVs',
                    near: `${percentageUsed}% of your CVs used. Only ${limit - currentUsage} left!`,
                    at: 'Academic CV limit reached! Upgrade for 50 documents/month.',
                    color: 'purple'
                }
            },
            ai_features: {
                reviews: {
                    icon: '🤖',
                    feature: 'AI Reviews',
                    near: `${percentageUsed}% of AI reviews used. Only ${limit - currentUsage} left!`,
                    at: 'AI review limit reached! Upgrade for 15 reviews/month.',
                    color: 'green'
                }
            }
        };
        
        const config = (baseConfig as any)[limitType]?.[featureType] || {
            icon: '⚡',
            feature: 'Features',
            near: `${percentageUsed}% of monthly limit used.`,
            at: 'Monthly limit reached! Upgrade for more access.',
            color: 'blue'
        };
        
        return {
            ...config,
            message: isAtLimit ? config.at : config.near,
            urgency: isAtLimit ? 'high' : percentageUsed >= 90 ? 'medium' : 'low'
        };
    }
    
    // Auto-hide toast after delay
    let autoHideTimer: ReturnType<typeof setTimeout> | undefined;
    $: if (isVisible && !isAtLimit) {
        clearTimeout(autoHideTimer);
        autoHideTimer = setTimeout(() => {
            isVisible = false;
        }, 8000); // Hide after 8 seconds for soft warnings
    }
    
    function handleUpgrade(planType: 'professional' | 'elite') {
        dispatch('upgrade', { planType });
        isVisible = false;
    }
    
    function dismiss() {
        isVisible = false;
        if (autoHideTimer) clearTimeout(autoHideTimer);
    }
</script>

{#if isVisible}
    <div 
        class="fixed top-4 right-4 z-50 max-w-sm"
        transition:fly={{ x: 300, duration: 300 }}
    >
        <div class="bg-white rounded-lg shadow-xl border-l-4 border-{toastConfig.color}-500 p-4 relative">
            <!-- Close button -->
            <button 
                on:click={dismiss}
                aria-label="Dismiss upgrade notice"
                class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            
            <!-- Content -->
            <div class="flex items-start space-x-3">
                <div class="text-2xl">{toastConfig.icon}</div>
                <div class="flex-1">
                    <h4 class="text-sm font-semibold text-gray-800 mb-1">
                        {#if isAtLimit}
                            Limit Reached!
                        {:else if percentageUsed >= 90}
                            Almost at your limit!
                        {:else}
                            Running low on {toastConfig.feature}
                        {/if}
                    </h4>
                    {#if !isAtLimit && percentageUsed > 0}
                        <p class="text-sm text-gray-600 mb-3">{toastConfig.message}</p>
                        <!-- Progress bar -->
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                                class="h-2 rounded-full transition-all duration-500 {percentageUsed >= 90 ? 'bg-red-500' : percentageUsed >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}"
                                style="width: {Math.min(percentageUsed, 100)}%"
                            ></div>
                        </div>
                    {:else}
                        <p class="text-sm text-gray-600 mb-4">Monthly limit reached! Upgrade for more access.</p>
                    {/if}
                    
                    <!-- Action buttons -->
                    <div class="flex space-x-2">
                        {#if isAtLimit}
                            <button 
                                on:click={() => handleUpgrade('professional')}
                                class="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded font-medium hover:bg-blue-700 transition-colors"
                            >
                                Upgrade Now
                            </button>
                        {:else}
                            <button 
                                on:click={() => handleUpgrade('professional')}
                                class="flex-1 bg-blue-100 text-blue-700 text-xs py-2 px-3 rounded font-medium hover:bg-blue-200 transition-colors"
                            >
                                Upgrade for More
                            </button>
                        {/if}
                        
                        {#if !isAtLimit}
                            <button 
                                on:click={dismiss}
                                class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Later
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if} 