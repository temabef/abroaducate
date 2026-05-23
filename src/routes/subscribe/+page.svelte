<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { SUBSCRIPTION_PLANS, FREE_PLAN, stripePromise } from '$lib/stripe';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
    
    let { supabase, session } = data;
    let currentPlan = $state('free');
    let loading = $state(false);
    
    onMount(async () => {
        if (!session?.user) {
            goto('/auth/login');
            return;
        }
        
        // Get current plan
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', session.user.id)
        .in('status', ['active','trialing'])
            .single();
        
        currentPlan = subscription?.plan_type || 'free';
    });
    
    async function subscribe(planType: 'professional' | 'elite') {
        if (loading) return;
        
        loading = true;
        
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ planType })
            });
            
            const result = await response.json();
            
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                throw new Error(result.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to start subscription process. Please try again.');
        } finally {
            loading = false;
        }
    }
    
    function getPlanCard(planKey: string, plan: any, price: number) {
        const isCurrentPlan = currentPlan === planKey;
        const isUpgrade = (currentPlan === 'free' && planKey !== 'free') || 
                          (currentPlan === 'professional' && planKey === 'elite');
        
        return {
            plan,
            price,
            isCurrentPlan,
            isUpgrade,
            buttonText: isCurrentPlan ? 'Current Plan' : 
                       isUpgrade ? `Upgrade to ${plan.name}` : 
                       planKey === 'free' ? 'Downgrade to Free' : 'Switch Plan',
            buttonDisabled: isCurrentPlan || loading
        };
    }
    
    // Calculate plan cards reactively
    let freeCard = $derived(getPlanCard('free', FREE_PLAN, 0));
    let proCard = $derived(getPlanCard('professional', SUBSCRIPTION_PLANS.professional, SUBSCRIPTION_PLANS.professional.prices.monthly));
    let eliteCard = $derived(getPlanCard('elite', SUBSCRIPTION_PLANS.elite, SUBSCRIPTION_PLANS.elite.prices.monthly));
</script>

<svelte:head>
    <title>Subscribe - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 pt-20">
    <div class="max-w-6xl mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                Unlock the full power of AI-enhanced SOP creation and analysis
            </p>
        </div>

        <!-- Plans Grid -->
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <!-- Free Plan -->
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 {freeCard.isCurrentPlan ? 'border-blue-500' : 'border-gray-200'}">
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">{FREE_PLAN.name}</h3>
                    <div class="mt-4">
                        <span class="text-4xl font-bold text-gray-900">$0</span>
                    </div>
                </div>
                
                <ul class="space-y-3 mb-8">
                    {#each FREE_PLAN.features as feature}
                        <li class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            {feature}
                        </li>
                    {/each}
                </ul>
                
                <button
                    disabled={freeCard.buttonDisabled}
                    class="w-full py-3 px-6 rounded-lg font-semibold transition-colors
                           {freeCard.isCurrentPlan 
                             ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                             : 'bg-gray-600 text-white hover:bg-gray-700'}"
                >
                    {freeCard.buttonText}
                </button>
            </div>

            <!-- Professional Plan -->
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 {proCard.isCurrentPlan ? 'border-blue-500' : 'border-gray-200'} relative">
                {#if proCard.isUpgrade && currentPlan === 'free'}
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                        </span>
                    </div>
                {/if}
                
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">{SUBSCRIPTION_PLANS.professional.name}</h3>
                    <div class="mt-4">
                        <span class="text-4xl font-bold text-gray-900">${SUBSCRIPTION_PLANS.professional.prices.monthly}</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                </div>
                
                <ul class="space-y-3 mb-8">
                    {#each SUBSCRIPTION_PLANS.professional.features as feature}
                        <li class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            {feature}
                        </li>
                    {/each}
                </ul>
                
                <button
                    disabled={proCard.buttonDisabled}
                    onclick={() => subscribe('professional')}
                    class="w-full py-3 px-6 rounded-lg font-semibold transition-colors
                           {proCard.isCurrentPlan 
                             ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                             : 'bg-blue-600 text-white hover:bg-blue-700'}"
                >
                    {loading ? 'Processing...' : proCard.buttonText}
                </button>
            </div>

            <!-- Elite Plan -->
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 {eliteCard.isCurrentPlan ? 'border-purple-500' : 'border-gray-200'} relative">
                {#if eliteCard.isUpgrade}
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span class="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Best Value
                        </span>
                    </div>
                {/if}
                
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">{SUBSCRIPTION_PLANS.elite.name}</h3>
                    <div class="mt-4">
                        <span class="text-4xl font-bold text-gray-900">${SUBSCRIPTION_PLANS.elite.prices.monthly}</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                </div>
                
                <ul class="space-y-3 mb-8">
                    {#each SUBSCRIPTION_PLANS.elite.features as feature}
                        <li class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            {feature}
                        </li>
                    {/each}
                </ul>
                
                <button
                    disabled={eliteCard.buttonDisabled}
                    onclick={() => subscribe('elite')}
                    class="w-full py-3 px-6 rounded-lg font-semibold transition-colors
                           {eliteCard.isCurrentPlan 
                             ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                             : 'bg-purple-600 text-white hover:bg-purple-700'}"
                >
                    {loading ? 'Processing...' : eliteCard.buttonText}
                </button>
            </div>
        </div>

        <!-- FAQ Section -->
        <div class="mt-16 max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">
                Frequently Asked Questions
            </h2>
            
            <div class="space-y-6">
                <div class="bg-white rounded-lg p-6 shadow-sm">
                    <h3 class="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
                    <p class="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.</p>
                </div>
                
                <div class="bg-white rounded-lg p-6 shadow-sm">
                    <h3 class="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                    <p class="text-gray-600">We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.</p>
                </div>
                
                <div class="bg-white rounded-lg p-6 shadow-sm">
                    <h3 class="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                    <p class="text-gray-600">Our Free plan allows you to try the basic features. You can upgrade anytime to access more advanced AI features and higher limits.</p>
                </div>
            </div>
        </div>
    </div>
</div> 
