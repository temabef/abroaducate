<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import LoginModal from '$lib/components/LoginModal.svelte';
    import { formStore, loadStateFromSessionStorage, pendingGeneration, clearStateFromSessionStorage } from '$lib/stores';
    import { get } from 'svelte/store';
    import { handleUpgradeRequired } from '$lib/services/upgradeService';

    export let data;
    let { session, supabase } = data;

    let showLogin = false;
    let status = 'Initializing...';
    let isGenerating = false;
    let hasTriedGeneration = false;

    // Reactive session handling
    $: {
        if (session && !isGenerating && !hasTriedGeneration) {
            showLogin = false;
            handleAuthenticatedUser();
        } else if (!session) {
            showLogin = true;
            status = 'Almost there! Please log in with Google to generate your Statement of Purpose.';
        }
    }

    onMount(async () => {
        console.log('Submit SOP page mounted');
        console.log('Session:', session);
        console.log('Pending generation:', get(pendingGeneration));
        
        // Check if we have form data
        const savedState = loadStateFromSessionStorage();
        console.log('Saved form state:', savedState);
        
        if (Object.keys(savedState).length === 0) {
            console.log('No form data found, redirecting to homepage');
            status = 'No form data found. Redirecting to the form...';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        // If user is already logged in, proceed
        if (session) {
            await handleAuthenticatedUser();
        }
    });

    async function handleAuthenticatedUser() {
        if (hasTriedGeneration) return;
        hasTriedGeneration = true;
        
        console.log('Handling authenticated user');
        status = 'Login successful. Starting generation...';
        
        // Small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await generateAndRedirect();
    }

    async function generateAndRedirect() {
        if (isGenerating) return;
        isGenerating = true;
        
        try {
            console.log('Starting SOP generation');
            status = 'Generating your Statement of Purpose... This may take a moment.';
            
            // Load and validate form data
            const savedState = loadStateFromSessionStorage();
            if (Object.keys(savedState).length === 0) {
                throw new Error('Could not find form data. Please start over.');
            }
            
            // Update the form store with saved data
            formStore.set({ ...$formStore, ...savedState });
            console.log('Form data loaded:', $formStore);

            // Make API call to generate SOP
            const response = await fetch('/api/generate-sop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify($formStore),
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                // Handle usage limit exceeded
                if (response.status === 403 && errorData.upgradeRequired) {
                    status = `🚀 ${errorData.message}`;
                    isGenerating = false;
                    hasTriedGeneration = false;
                    
                    // Use new beautiful upgrade system
                    handleUpgradeRequired(errorData);
                    return;
                }
                
                throw new Error(errorData.error || 'Failed to generate SOP.');
            }

            const result = await response.json();
            console.log('SOP generation result:', result);

            // Clear temporary data
            clearStateFromSessionStorage();
            pendingGeneration.set(false);
            
            status = 'SOP generated successfully! Redirecting to your SOP...';
            
            // Redirect directly to the generated SOP for editing
            setTimeout(() => {
                goto(`/sop/${result.sopId}`);
            }, 1500);

        } catch (error: any) {
            console.error('SOP generation error:', error);
            status = `Error: ${error.message}`;
            isGenerating = false;
            hasTriedGeneration = false;
            
            // Allow retry after error
            setTimeout(() => {
                if (!isGenerating) {
                    status += ' Please try again or contact support.';
                }
            }, 3000);
        }
    }

    // Handle manual retry
    async function handleRetry() {
        hasTriedGeneration = false;
        if (session) {
            await handleAuthenticatedUser();
        }
    }
</script>

<div class="submission-container">
    <div class="status-box">
        {#if !session}
            <h1 class="title">Ready to Generate Your SOP!</h1>
            <p class="status-message">{status}</p>
            <p class="sub-message">We've saved your form data. Just log in to continue.</p>
        {:else}
            <h1 class="title">Processing Your SOP</h1>
            <p class="status-message">{status}</p>
            {#if isGenerating}
                <div class="spinner"></div>
            {:else if status.includes('Error')}
                <button on:click={handleRetry} class="retry-button">
                    Try Again
                </button>
            {/if}
        {/if}
    </div>
</div>

<LoginModal bind:show={showLogin} {supabase} />

<style>
    .submission-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        text-align: center;
        padding: 2rem;
    }
    .status-box {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
    }
    .title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1f2937;
    }
    .status-message {
        font-size: 1.1rem;
        color: #4B5563;
        margin-bottom: 2rem;
        line-height: 1.6;
    }
    .sub-message {
        font-size: 1rem;
        color: #6B7280;
        margin-bottom: 1rem;
        font-style: italic;
    }
    .spinner {
        margin: 0 auto;
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0,0,0,0.1);
        border-left-color: #4F46E5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    .retry-button {
        background-color: #4F46E5;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    .retry-button:hover {
        background-color: #4338CA;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style> 