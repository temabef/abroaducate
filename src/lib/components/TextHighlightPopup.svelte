<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let selectedText: string = '';
    export let position: { x: number, y: number } = { x: 0, y: 0 };
    export let visible: boolean = false;
    export let placedAbove: boolean = false;
    
    const editingOptions = [
        { label: 'Concise', value: 'concise', icon: '✂️' },
        { label: 'Detailed', value: 'detailed', icon: '📝' },
        { label: 'Research', value: 'research', icon: '🔬' },
        { label: 'Academic', value: 'academic', icon: '🎓' },
        { label: 'Technical', value: 'technical', icon: '⚙️' }
    ];
    
    function handleOptionClick(option: string) {
        dispatch('optionSelected', {
            selectedText,
            option
        });
    }
    
    function handleClose() {
        dispatch('close');
    }
</script>

{#if visible && selectedText.trim()}
    <div 
        class="highlight-popup"
        class:placed-above={placedAbove}
        style="left: {position.x}px; top: {position.y}px;"
    >
        <div class="popup-header">
            <span class="magic-icon">🪄</span>
            <span class="popup-title">Ask GPT to make this part more...</span>
            <button class="close-button" on:click={handleClose}>×</button>
        </div>
        
        <div class="options-container">
            {#each editingOptions as option}
                <button 
                    class="option-button"
                    on:click={() => handleOptionClick(option.value)}
                >
                    <span class="option-icon">{option.icon}</span>
                    <span class="option-label">{option.label}</span>
                </button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .highlight-popup {
        position: absolute;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 0.5rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        font-family: 'Inter', sans-serif;
        animation: popupFadeIn 0.15s ease-out;
        width: 400px;
        backdrop-filter: blur(10px);
    }
    
    @keyframes popupFadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .popup-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #F1F5F9;
        background-color: #F8FAFC;
        border-radius: 0.5rem 0.5rem 0 0;
    }
    
    .magic-icon {
        font-size: 1rem;
    }
    
    .popup-title {
        flex: 1;
        font-size: 0.8rem;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.1rem;
        color: #9CA3AF;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .close-button:hover {
        background-color: #F3F4F6;
        color: #6B7280;
    }
    
    .options-container {
        padding: 0.5rem;
        display: flex;
        gap: 0.4rem;
        justify-content: space-between;
        flex-wrap: nowrap;
    }
    
    .option-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
        padding: 0.4rem 0.5rem;
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
        min-height: auto;
        flex: 1;
    }
    
    .option-button:hover {
        background: #3B82F6;
        border-color: #3B82F6;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    
    .option-icon {
        font-size: 0.8rem;
    }
    
    .option-label {
        font-weight: 500;
    }
    
    /* Responsive adjustments for smaller screens */
    @media (max-width: 640px) {
        .highlight-popup {
            width: 360px;
        }
        
        .popup-title {
            font-size: 0.75rem;
        }
        
        .option-button {
            padding: 0.35rem 0.4rem;
            font-size: 0.65rem;
        }
        
        .option-icon {
            font-size: 0.75rem;
        }
    }
    
    /* Very narrow screens - keep single line but make smaller */
    @media (max-width: 480px) {
        .highlight-popup {
            width: 300px;
        }
        
        .option-button {
            padding: 0.3rem 0.3rem;
            font-size: 0.6rem;
        }
        
        .option-icon {
            font-size: 0.7rem;
        }
    }
    
    /* Visual indicator when placed above selection */
    .highlight-popup.placed-above::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
    }
</style> 