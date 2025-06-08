<script lang="ts">
    import { onMount } from 'svelte';
    import { loadStateFromSessionStorage, pendingGeneration } from '$lib/stores';
    import { get } from 'svelte/store';
    
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
</script>

<div class="debug-container">
    <h1>Debug Information</h1>
    
    <div class="debug-section">
        <h2>Session Status</h2>
        <p><strong>Logged in:</strong> {session ? 'Yes' : 'No'}</p>
        {#if session}
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
        {/if}
    </div>
    
    <div class="debug-section">
        <h2>Form State</h2>
        <p><strong>Has form data:</strong> {Object.keys(formData).length > 0 ? 'Yes' : 'No'}</p>
        <p><strong>Pending generation:</strong> {isPending ? 'Yes' : 'No'}</p>
        {#if Object.keys(formData).length > 0}
            <details>
                <summary>Show form data</summary>
                <pre>{JSON.stringify(formData, null, 2)}</pre>
            </details>
        {/if}
    </div>
    
    <div class="debug-section">
        <h2>Actions</h2>
        <button on:click={clearStorage}>Clear All Storage</button>
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