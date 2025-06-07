<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Fa } from 'svelte-fa';
    import { faFileAlt, faMagic } from '@fortawesome/free-solid-svg-icons';

    const dispatch = createEventDispatcher();

    let showModal = false;
    let dontShowAgain = false;

    onMount(() => {
        const hasSeenModal = localStorage.getItem('hasSeenSOPReadyModal');
        if (hasSeenModal !== 'true') {
            // Simulate generation delay, then show modal
            setTimeout(() => {
                showModal = true;
            }, 1000); // Short delay after page load
        } else {
            // If user opted not to see it again, dispatch immediately
            dispatch('modalClosed', { dontShowAgain: true });
        }
    });

    function handleOk() {
        if (dontShowAgain) {
            localStorage.setItem('hasSeenSOPReadyModal', 'true');
        }
        showModal = false;
        dispatch('modalClosed', { dontShowAgain });
    }
</script>

{#if showModal}
    <div class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <Fa icon={faFileAlt} />
                <h2>Your statement of purpose is ready!</h2>
            </div>
            <p>If you want to make finer edits, highlight the text you'd like to change to access the pop-up below:</p>
            <div class="suggestion-buttons">
                <p class="suggestion-prompt"><Fa icon={faMagic} /> Ask GPT to make this part more..</p>
                <div class="buttons-row">
                    <button class="suggest-button">Concise</button>
                    <button class="suggest-button">Detailed</button>
                    <button class="suggest-button">Professional</button>
                    <button class="suggest-button">Informal</button>
                </div>
            </div>
            <div class="modal-footer">
                <label class="checkbox-container">
                    <input type="checkbox" bind:checked={dontShowAgain}>
                    <span class="checkmark"></span>
                    Don't show me this again
                </label>
                <button class="ok-button" on:click={handleOk}>OK</button>
            </div>
        </div>
    </div>
{/if}

<style lang="postcss">
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 500px;
        text-align: center;
        font-family: 'Inter', sans-serif;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .modal-header h2 {
        font-size: 1.5rem;
        color: #1E293B;
        margin: 0;
    }

    .modal-content p {
        font-size: 1rem;
        color: #475569;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

    .suggestion-buttons {
        background-color: #F1F5F9;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .suggestion-prompt {
        font-size: 0.875rem;
        color: #64748B;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
    }

    .buttons-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
    }

    .suggest-button {
        background-color: #007bff; /* Primary blue */
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .suggest-button:hover {
        background-color: #0056b3; /* Darker blue on hover */
    }

    .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
    }

    .checkbox-container {
        display: block;
        position: relative;
        padding-left: 1.75rem;
        margin-bottom: 0;
        cursor: pointer;
        font-size: 0.9rem;
        color: #475569;
        user-select: none;
        text-align: left;
    }

    .checkbox-container input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 1.25rem;
        width: 1.25rem;
        background-color: #E2E8F0;
        border-radius: 0.25rem;
        transition: background-color 0.2s ease;
    }

    .checkbox-container input:checked ~ .checkmark {
        background-color: #007bff; /* Primary blue */
    }

    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }

    .checkbox-container input:checked ~ .checkmark:after {
        display: block;
    }

    .checkbox-container .checkmark:after {
        left: 0.45rem;
        top: 0.2rem;
        width: 0.35rem;
        height: 0.7rem;
        border: solid white;
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
    }

    .ok-button {
        background-color: #007bff; /* Primary blue */
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: background-color 0.2s ease;
    }

    .ok-button:hover {
        background-color: #0056b3; /* Darker blue on hover */
    }

    @media (max-width: 600px) {
        .modal-content {
            padding: 1.5rem;
        }

        .modal-header h2 {
            font-size: 1.25rem;
        }

        .modal-content p {
            font-size: 0.9rem;
        }

        .modal-footer {
            flex-direction: column;
            gap: 1rem;
        }

        .checkbox-container {
            margin-bottom: 0.5rem;
        }

        .ok-button {
            width: 100%;
        }
    }
</style>