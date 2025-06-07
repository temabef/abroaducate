<script lang="ts">
    import { onMount } from 'svelte';

    let statementsStarted: string = '500+'; // Initial placeholder, will be fetched
    let wordsWritten: string = '10K+'; // Initial placeholder, will be fetched
    let freeCreditReady: number = 1;

    onMount(async () => {
        // In a real application, you would fetch these values from your backend API.
        // For example:
        // try {
        //     const response = await fetch('/api/metrics');
        //     const data = await response.json();
        //     statementsStarted = data.statementsStarted;
        //     wordsWritten = data.wordsWritten;
        //     freeCreditReady = data.freeCreditReady;
        // } catch (error) {
        //     console.error('Failed to fetch metrics:', error);
        //     // Optionally, handle error by keeping placeholder or showing an error state
        // }

        // Mock data fetching for demonstration
        setTimeout(() => {
            statementsStarted = '1,234+'; // Example: dynamically updated
            wordsWritten = '500K+';   // Example: dynamically updated
            // freeCreditReady remains 1 as it's a static user-specific value
        }, 2000);
    });
</script>

<section class="start-journey-section">
    <div class="container">
        <h2 class="title">Start Your Journey Towards an Outstanding SOP</h2>
        <p class="journey-description">
            Join thousands of aspiring students who have successfully crafted their Statements of Purpose with our AI-powered platform.
        </p>

        <div class="metrics-container">
            <div class="metric-card">
                <div class="icon-value-wrapper">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span class="value">{statementsStarted}</span>
                </div>
                <span class="label">Statements Started</span>
            </div>
            <div class="metric-card">
                <div class="icon-value-wrapper">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V6.5A2.5 2.5 0 0 0 17.5 4h-11A2.5 2.5 0 0 0 4 6.5v13z"></path></svg>
                    <span class="value">{wordsWritten}</span>
                </div>
                <span class="label">Words Written</span>
            </div>
            <div class="metric-card">
                <div class="icon-value-wrapper">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span class="value">{freeCreditReady}</span>
                </div>
                <span class="label">Free Credit Ready</span>
            </div>
        </div>
    </div>
</section>

<style lang="postcss">
    .start-journey-section {
        padding: 4rem 1rem;
        background-color: #FFFFFF;
        text-align: center;
    }

    .container {
        max-width: 1000px;
        margin: 0 auto;
    }

    .title {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 1rem;
    }

    .journey-description {
        color: #64748B;
        font-size: 1.1rem;
        line-height: 1.6;
        max-width: 700px;
        margin: 0 auto 3rem;
    }

    .metrics-container {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .metric-card {
        background-color: #FFFFFF;
        border-radius: 0.75rem;
        padding: 1.5rem 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-width: 180px;
        max-width: 220px;
        text-align: center;
    }

    .icon-value-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
    }

    .metric-card .icon {
        color: #2196F3;
        width: 32px;
        height: 32px;
    }

    .metric-card .value {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1E293B;
    }

    .metric-card .label {
        font-size: 1rem;
        color: #64748B;
        text-align: center;
        margin-top: 0.5rem;
    }

    .journey-description {
        font-size: 1.05rem;
    }

    @media (max-width: 768px) {
        .metrics-container {
            gap: 1rem;
        }

        .metric-card {
            flex-basis: calc(50% - 0.75rem);
        }

        .title {
            font-size: 1.8rem;
        }

        .metric-card .icon {
            width: 28px;
            height: 28px;
        }

        .metric-card .value {
            font-size: 1.8rem;
        }

        .metric-card .label {
            margin-top: 0.25rem;
        }
    }

    @media (max-width: 480px) {
        .metric-card {
            flex-basis: 100%;
            max-width: 100%;
        }
    }
</style>