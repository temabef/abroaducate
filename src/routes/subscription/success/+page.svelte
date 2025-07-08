<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { SUBSCRIPTION_PLANS } from '$lib/stripe';
    import type { PageData } from './$types';
    
    export let data: PageData;
    let { supabase, session } = data;
    
    // Type definitions
    type PlanType = 'professional' | 'elite';
    type SubscriptionData = {
        plan_type: PlanType;
        user_id: string;
        status: string;
        [key: string]: any;
    };
    
    let sessionId = '';
    let loading = true;
    let error = '';
    let subscription: SubscriptionData | null = null;
    let planDetails: any = null;
    let planFromUrl: PlanType = 'professional';
    let billingCycle: 'monthly' | 'annual' = 'monthly';
    
    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        sessionId = urlParams.get('session_id') || '';
        planFromUrl = (urlParams.get('plan') as PlanType) || 'professional'; // Get plan from URL as backup
        

        
        if (!sessionId) {
            error = 'Invalid session';
            loading = false;
            return;
        }
        
        if (!session?.user) {
            goto('/');
            return;
        }
        
        // Immediately set fallback data based on URL parameter
        subscription = { 
            plan_type: planFromUrl, 
            user_id: session?.user?.id || '', 
            status: 'active' 
        };
        if (planFromUrl in SUBSCRIPTION_PLANS) {
            planDetails = SUBSCRIPTION_PLANS[planFromUrl];

        }
        
        // Try to detect billing cycle from Stripe session
        if (sessionId) {
            detectBillingCycle();
        }
        
        // Wait a bit for webhook to process, then try to fetch subscription from DB
        setTimeout(async () => {
            await fetchSubscription();
            loading = false;
        }, 3000);
    });
    
    async function detectBillingCycle() {
        // For now, let's add a simple URL parameter for billing cycle
        // In production, this would come from Stripe session metadata
        const urlParams = new URLSearchParams(window.location.search);
        const cycleParam = urlParams.get('billing_cycle');
        
        if (cycleParam === 'annual') {
            billingCycle = 'annual';
        } else {
            billingCycle = 'monthly';
        }
    }

    async function fetchSubscription() {
        try {
            if (!session?.user?.id) return;
            
            const { data: subData, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();
                
            if (subError) {
                console.error('Error fetching subscription:', subError);
                return;
            }
            
            // Only update if we got a valid PAID subscription that matches our expectation
            // Don't override URL plan with "free" plan when user just completed a paid subscription
            if (subData && subData.plan_type && subData.plan_type !== 'free') {
                subscription = subData as SubscriptionData;
                
                // Get plan details from DB result
                if (subscription.plan_type in SUBSCRIPTION_PLANS) {
                    planDetails = SUBSCRIPTION_PLANS[subscription.plan_type];

                }
            } else if (subData && subData.plan_type === 'free') {

            }
        } catch (err) {
            console.error('Error:', err);

        }
    }
    
    function goToCreateSOP() {
        // Redirect to home page form section
        window.location.href = '/#form-section';
    }
    
    function goToAccount() {
        goto('/account');
    }
    
    function getPlanName(): string {
        const planType: PlanType = subscription?.plan_type || planFromUrl || 'professional';
        return planType === 'professional' ? 'Professional Plan' : 'Elite Plan';
    }
    
    function getPlanPrice(): string {
        const planType: PlanType = subscription?.plan_type || planFromUrl || 'professional';
        
        // Get the actual price from SUBSCRIPTION_PLANS based on billing cycle
        if (planType in SUBSCRIPTION_PLANS) {
            const plan = SUBSCRIPTION_PLANS[planType];
            const price = plan.prices[billingCycle];
            const displayText = billingCycle === 'annual' ? `/month (billed annually)` : '/month';
            return `$${price}${displayText}`;
        }
        
        return planType === 'professional' ? '$12' : '$29';
    }
    
    function getPlanEmoji(): string {
        const planType: PlanType = subscription?.plan_type || planFromUrl || 'professional';
        return planType === 'professional' ? '⭐' : '👑';
    }
</script>

<svelte:head>
    <title>Subscription Successful - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 pt-20">
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        {#if loading}
            <!-- Loading State -->
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">
                Processing Your Subscription...
            </h1>
            <p class="text-gray-600">
                Please wait while we activate your account.
            </p>
        {:else if error}
            <!-- Error State -->
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
            </h1>
            <p class="text-gray-600 mb-6">
                {error}
            </p>
            <button
                onclick={() => goto('/subscribe')}
                class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Try Again
            </button>
        {:else}
            <!-- Success State -->
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            
            <h1 class="text-2xl font-bold text-gray-900 mb-4">
                Subscription Successful! {getPlanEmoji()}
            </h1>
            
            <div class="mb-4 p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                <h2 class="text-lg font-semibold text-gray-900">{getPlanName()}</h2>
                <p class="text-sm text-gray-600">{getPlanPrice()}</p>
            </div>
            
            <p class="text-gray-600 mb-6">
                Welcome to {getPlanName()}! Your account has been upgraded and you now have access to all {getPlanName().toLowerCase()} features.
            </p>
            
            <div class="space-y-3">
                <button
                    onclick={goToCreateSOP}
                    class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Start Creating SOPs
                </button>
                
                <button
                    onclick={goToAccount}
                    class="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                    View Account Details
                </button>
            </div>
            
            <div class="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-blue-900 mb-3">What's Next?</h3>
                {#if planDetails?.features}
                    <ul class="text-sm text-blue-800 space-y-2 text-left">
                        {#each planDetails.features as feature}
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                {feature}
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <!-- Show plan-specific features based on plan type -->
                    <ul class="text-sm text-blue-800 space-y-2 text-left">
                        {#if (subscription?.plan_type || planFromUrl) === 'professional'}
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                10 SOPs per month
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                50 AI improvements
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                10 analytics reports
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                10 plagiarism checks
                            </li>
                        {:else}
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Unlimited SOPs
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Unlimited AI improvements
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Unlimited analytics
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Priority support
                            </li>
                        {/if}
                    </ul>
                {/if}
            </div>
        {/if}
    </div>
</div> 