<script lang="ts">
    import { onMount } from 'svelte';
    import UpgradeModal from '$lib/components/UpgradeModal.svelte';

    // Mock user object
    let user = {
        plan: 'free' // Can be 'free', 'professional', or 'elite'
    };

    let showUpgradeModal = false;
    let featureRequest = '';

    function handleUpgradeRequest(event: any) {
        showUpgradeModal = true;
        featureRequest = event.detail.feature;
    }

    function handleUpgrade(event: any) {
        console.log('Upgrade clicked:', event.detail);
        // Here you would navigate to the pricing page or handle the upgrade
        showUpgradeModal = false;
        alert(`Redirecting to upgrade for ${event.detail.requiredPlan} plan!`);
        window.location.href = '/pricing';
    }
</script>

<svelte:head>
    <title>Upgrade Demo</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-8">
    <h1 class="text-3xl font-bold mb-4">Upgrade Modal Demo</h1>
    <p class="mb-6">
        This page demonstrates how to use the `UpgradeModal` component to gate features based on user subscription plans.
    </p>

    <div class="space-y-4">
        <div class="p-6 border rounded-lg">
            <h2 class="text-xl font-semibold">Version History</h2>
            <p class="text-gray-600 mb-4">Access detailed version history for all your documents.</p>
            {#if user.plan === 'free'}
                <button 
                    on:click={() => handleUpgradeRequest({ detail: { feature: 'Version History' }})} 
                    class="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200">
                    Upgrade to Use
                </button>
            {:else}
                <p class="text-green-600 font-semibold">✅ Unlocked</p>
            {/if}
        </div>

        <div class="p-6 border rounded-lg">
            <h2 class="text-xl font-semibold">AI-Powered Plagiarism Checker</h2>
            <p class="text-gray-600 mb-4">Ensure your work is original with our advanced plagiarism checker.</p>
            {#if user.plan === 'free' || user.plan === 'professional'}
                 <button 
                    on:click={() => handleUpgradeRequest({ detail: { feature: 'Plagiarism Checker' }})} 
                    class="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200">
                    Upgrade to Use
                </button>
            {:else}
                <p class="text-green-600 font-semibold">✅ Unlocked</p>
            {/if}
        </div>
    </div>

    {#if showUpgradeModal}
        <UpgradeModal 
            featureType={featureRequest} 
            currentPlan={user.plan}
            isOpen={showUpgradeModal}
            on:close={() => showUpgradeModal = false}
            on:upgrade={handleUpgrade}
        />
    {/if}

</div> 