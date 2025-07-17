<script lang="ts">
    import { onMount } from 'svelte';
    import { loadStateFromSessionStorage, pendingGeneration } from '$lib/stores';
    import { get } from 'svelte/store';
    import { analytics } from '$lib/utils/posthog';
    
    export let data;
    let { session, supabase } = data;
    
    let formData: any = {};
    let isPending = false;
    
    onMount(() => {
        formData = loadStateFromSessionStorage();
        isPending = get(pendingGeneration);
    });
    
    function clearStorage() {
        sessionStorage.clear();
        pendingGeneration.set(false);
        location.reload();
    }

    function testPostHog() {
      analytics.trackEvent('test_event', {
        test_property: 'test_value',
        timestamp: new Date().toISOString()
      });
      alert('Test event sent to PostHog! Check your dashboard.');
    }
</script>

<svelte:head>
  <title>Debug - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-4xl mx-auto px-4">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>
    
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">PostHog Analytics Test</h2>
      <button 
        on:click={testPostHog}
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Test Event to PostHog
      </button>
      <p class="text-sm text-gray-600 mt-2">
        Click this button to manually send a test event to PostHog for verification.
      </p>
    </div>
  </div>
</div>

<style>
    .debug-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        font-family: monospace;
    }
    
    .debug-section {
        margin-bottom: 2rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    h1, h2 {
        color: #333;
    }
    
    pre {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
    }
    
    button {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }
    
    button:hover {
        background: #c82333;
    }
</style> 