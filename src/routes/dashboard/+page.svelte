<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores'; // Import page store to access URL search parameters

    // Remove 'export let data' if you're not using a +page.server.ts or +page.ts load function
    // export let data: { generatedSOP: string | null }; 

    // Access SOP from URL search parameters
    let generatedSOP = '';

    // On mount, check if SOP is in URL search parameters
    $: {
        if ($page.url.searchParams.has('sop')) {
            generatedSOP = decodeURIComponent($page.url.searchParams.get('sop') || '');
            // Optionally, clear the search parameter from the URL after reading it
            // history.replaceState({}, '', $page.url.pathname); 
        } else {
            // Fallback message if SOP is not found
            generatedSOP = `Your SOP will appear here after generation.`;
        }
    }

    let currentDashboardView: 'sop' | 'jobs' = 'sop';

    function saveChanges() {
        alert('Saving changes...'); // Placeholder for save functionality
    }

    function copySOP() {
        navigator.clipboard.writeText(generatedSOP);
        alert('SOP copied to clipboard!');
    }

    function navigateToJobsDashboard() {
        currentDashboardView = 'jobs';
    }

    function navigateToAccount() {
        goto('/account');
    }
</script>

{#if currentDashboardView === 'sop'}
    <div class="dashboard-content">
        <div class="sop-display-box">
            <pre>{generatedSOP}</pre>
        </div>
        <div class="action-buttons">
            <button class="save-button" on:click={saveChanges}>Save Changes</button>
            <button class="copy-button" on:click={copySOP}>Copy</button>
        </div>
    </div>
{:else if currentDashboardView === 'jobs'}
    <!-- ApplicationDashboard component will be rendered here if needed -->
    <!-- For now, it's just a placeholder, as the user primarily wants SOP generation -->
    <div class="dashboard-content">
        <h2>Jobs Dashboard (Under Construction)</h2>
        <p>This section will list job applications and related features.</p>
    </div>
{/if}

<style lang="postcss">
    .dashboard-content {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        font-family: 'Inter', sans-serif;
        margin-top: 5rem; /* Added margin-top to account for fixed navbar */
    }

    .sop-display-box {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        min-height: 400px;
        text-align: left;
        white-space: pre-wrap; /* Preserves whitespace and wraps text */
        word-wrap: break-word; /* Breaks long words */
        overflow-y: auto;
        color: #1E293B;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .save-button,
    .copy-button {
        background-color: #6D28D9; /* Purple */
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: background-color 0.2s ease;
    }

    .save-button:hover,
    .copy-button:hover {
        background-color: #7C3AED; /* Darker purple on hover */
    }

    @media (max-width: 600px) {
        .dashboard-content {
            padding: 1rem;
        }

        .action-buttons {
            flex-direction: column;
        }

        .save-button,
        .copy-button {
            width: 100%;
        }
    }
</style> 