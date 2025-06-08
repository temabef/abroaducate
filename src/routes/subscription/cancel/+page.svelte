<script lang="ts">
    import { goto } from '$app/navigation';
</script>

<svelte:head>
    <title>Subscription Cancelled - SOP Generator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12">
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <!-- Cancel Icon -->
        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </div>
        
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
            Subscription Cancelled
        </h1>
        
        <p class="text-gray-600 mb-6">
            No worries! Your subscription wasn't processed. You can try again anytime or continue using our free plan.
        </p>
        
        <div class="space-y-3">
            <button
                onclick={() => goto('/subscribe')}
                class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Try Again
            </button>
            
            <button
                onclick={() => goto('/dashboard')}
                class="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
                Continue with Free Plan
            </button>
        </div>
        
        <div class="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-semibold text-blue-900 mb-2">Free Plan Includes:</h3>
            <ul class="text-sm text-blue-800 space-y-1">
                <li>✓ 1 SOP per month</li>
                <li>✓ 3 AI improvements</li>
                <li>✓ 1 analytics report</li>
                <li>✓ 1 plagiarism check</li>
            </ul>
        </div>
    </div>
</div> 