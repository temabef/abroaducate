<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
    import { personalStatementFormStore, loadPersonalStatementStateFromSessionStorage, personalStatementPendingGeneration, clearPersonalStatementStateFromSessionStorage } from '$lib/stores/personalStatementStore';
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
            status = 'Almost there! Please log in to generate your Personal Statement.';
        }
    }

    onMount(async () => {
        console.log('Submit Personal Statement page mounted');
        console.log('Session:', session);
        console.log('Pending generation:', get(personalStatementPendingGeneration));
        
        // Check if we have form data
        const savedState = loadPersonalStatementStateFromSessionStorage();
        console.log('Saved form state:', savedState);
        
        if (Object.keys(savedState).length === 0) {
            console.log('No form data found, redirecting to personal statements page');
            status = 'No form data found. Redirecting to the form...';
            setTimeout(() => goto('/personal-statements'), 2000);
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
            console.log('Starting Personal Statement generation');
            status = 'Generating your Personal Statement... This may take a moment.';
            
            // Load and validate form data
            const savedState = loadPersonalStatementStateFromSessionStorage();
            if (Object.keys(savedState).length === 0) {
                throw new Error('Could not find form data. Please start over.');
            }
            
            // Update the form store with saved data
            personalStatementFormStore.set({ ...$personalStatementFormStore, ...savedState });
            console.log('Form data loaded:', $personalStatementFormStore);

            // Make API call to generate Personal Statement
            const response = await fetch('/api/generate-personal-statement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify($personalStatementFormStore),
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
                
                throw new Error(errorData.error || 'Failed to generate Personal Statement.');
            }

            const result = await response.json();
            console.log('Personal Statement generation result:', result);

            // Save the generated personal statement
            const saveResponse = await fetch('/api/save-personal-statement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...$personalStatementFormStore,
                    generatedContent: result.personalStatement,
                    wordCount: result.personalStatement.split(' ').length
                })
            });

            if (!saveResponse.ok) {
                throw new Error('Failed to save Personal Statement');
            }

            const saveResult = await saveResponse.json();

            // Clear temporary data
            clearPersonalStatementStateFromSessionStorage();
            personalStatementPendingGeneration.set(false);
            
            status = 'Personal Statement generated successfully! Redirecting to your Personal Statement...';
            
            // Redirect directly to the generated Personal Statement for editing
            setTimeout(() => {
                goto(`/personal-statements/${saveResult.personalStatementId}`);
            }, 1500);

        } catch (error: any) {
            console.error('Personal Statement generation error:', error);
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
            <h1 class="title">Ready to Generate Your Personal Statement!</h1>
            <p class="status-message">{status}</p>
            <p class="sub-message">We've saved your form data. Just log in to continue.</p>
        {:else}
            <h1 class="title">Processing Your Personal Statement</h1>
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

<AuthenticationFlow bind:show={showLogin} {supabase} mode="login" returnUrl="/submit-personal-statement" />

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
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    .retry-button {
        background-color: #3B82F6;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .retry-button:hover {
        background-color: #2563EB;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style> 