<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    let { supabase, session } = data;
    let subscription: any = null;
    let loading = true;
    let canceling = false;
    
    onMount(async () => {
        if (!session?.user) {
            goto('/auth/login');
            return;
        }
        
        await loadSubscription();
    });
    
    async function loadSubscription() {
        try {
            const { data: subData, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();
            
            if (error) {
                console.error('Error loading subscription:', error);
            } else {
                subscription = subData;
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            loading = false;
        }
    }
    
    async function cancelSubscription() {
        if (!subscription?.stripe_subscription_id) return;
        
        canceling = true;
        
        try {
            const response = await fetch('/api/stripe/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: subscription.stripe_subscription_id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }
            
            // Refresh subscription data
            await loadSubscription();
            
            alert('Subscription canceled successfully. It will remain active until the end of your billing period.');
            
        } catch (error) {
            console.error('Error canceling subscription:', error);
            alert('Failed to cancel subscription. Please try again.');
        } finally {
            canceling = false;
        }
    }
    
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function getPlanName(planType: string): string {
        switch (planType) {
            case 'basic': return 'Basic Plan';
            case 'pro': return 'Pro Plan';
            default: return 'Free Plan';
        }
    }
    
    function getPlanPrice(planType: string): string {
        switch (planType) {
            case 'basic': return '$4.99';
            case 'pro': return '$19.99';
            default: return '$0';
        }
    }
</script>

<svelte:head>
    <title>Manage Subscription - SOP Generator</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 pt-24">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Manage Subscription</h1>
        <p class="text-gray-600">Manage your plan, billing, and subscription settings</p>
    </div>
    
    {#if loading}
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading subscription details...</p>
        </div>
    {:else}
        <!-- Current Plan -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
            
            {#if subscription}
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">
                            {getPlanName(subscription.plan_type)}
                        </h3>
                        <p class="text-gray-600 mb-2">
                            {getPlanPrice(subscription.plan_type)}/month
                        </p>
                        <p class="text-sm text-gray-500">
                            Status: <span class="capitalize font-medium text-green-600">{subscription.status}</span>
                        </p>
                        {#if subscription.current_period_end}
                            <p class="text-sm text-gray-500">
                                Next billing date: {formatDate(subscription.current_period_end)}
                            </p>
                        {/if}
                    </div>
                    
                    <div class="text-right">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Active
                        </span>
                    </div>
                </div>
            {:else}
                <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Free Plan</h3>
                    <p class="text-gray-600 mb-4">You're currently on the free plan</p>
                    <a href="/subscribe" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Upgrade Plan
                    </a>
                </div>
            {/if}
        </div>
        
        {#if subscription}
            <!-- Plan Features -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Plan Features</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#if subscription.plan_type === 'basic'}
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            10 SOPs per month
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            50 AI improvements
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            10 analytics reports
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            10 plagiarism checks
                        </div>
                    {:else if subscription.plan_type === 'pro'}
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            Unlimited SOPs
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            Unlimited AI improvements
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            Unlimited analytics
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            Unlimited plagiarism checks
                        </div>
                        <div class="flex items-center text-gray-700">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            Priority support
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Subscription Actions -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Subscription Actions</h2>
                
                <div class="space-y-4">
                    <!-- Upgrade/Downgrade -->
                    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 class="font-medium text-gray-900">Change Plan</h3>
                            <p class="text-sm text-gray-600">Upgrade or downgrade your subscription</p>
                        </div>
                        <a href="/subscribe" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            View Plans
                        </a>
                    </div>
                    
                    <!-- Cancel Subscription -->
                    <div class="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                        <div>
                            <h3 class="font-medium text-gray-900">Cancel Subscription</h3>
                            <p class="text-sm text-gray-600">Your subscription will remain active until the end of your billing period</p>
                        </div>
                        <button 
                            onclick={cancelSubscription}
                            disabled={canceling}
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {canceling ? 'Canceling...' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div> 