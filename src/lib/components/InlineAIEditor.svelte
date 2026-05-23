<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    export let selectedText: string = '';
    export let editType: string = 'improve';
    export let context: string = '';
    export let show: boolean = false;
    export let position: { x: number; y: number } = { x: 0, y: 0 };
    
    const dispatch = createEventDispatcher();
    
    let processing = false;
    
    function handleEditSuccess(event: CustomEvent) {
        const { result } = event.detail;
        
        // Dispatch the edited text back to parent
        dispatch('textEdited', {
            originalText: selectedText,
            editedText: typeof result === 'string' ? result : result.editedText || result,
            editType
        });
        
        // Close the popup
        dispatch('close');
    }
    
    function close() {
        dispatch('close');
    }
    
    // Map edit types to enhancement types
    $: enhancementType = editType === 'improve' ? 'professional' : 
                        editType === 'academic' ? 'academic' : 
                        editType === 'concise' ? 'concise' : 'professional';
</script>

{#if show}
    <!-- Overlay -->
    <button
        type="button"
        class="fixed inset-0 bg-black bg-opacity-20 z-40"
        on:click={close}
        aria-label="Close editor"
    ></button>
    
    <!-- Popup -->
    <div 
        class="fixed z-50 bg-white rounded-lg shadow-xl border max-w-md w-full"
        style="left: {Math.max(10, Math.min(position.x - 200, window.innerWidth - 420))}px; top: {Math.max(10, position.y - 100)}px;"
    >
        <div class="p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-900">✨ Edit Selected Text</h3>
                <button 
                    on:click={close}
                    class="text-gray-400 hover:text-gray-600"
                    aria-label="Close text editor popup"
                >
                    ✕
                </button>
            </div>
            
            <!-- Selected Text Preview -->
            <div class="mb-4 p-3 bg-gray-50 rounded border text-sm">
                <strong>Selected:</strong> "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
            </div>
            
            <!-- Edit Type Selection -->
            <div class="mb-4">
                <label for="inline-ai-editor-type" class="block text-sm font-medium text-gray-700 mb-2">Enhancement Type:</label>
                <select 
                    id="inline-ai-editor-type"
                    bind:value={editType}
                    class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                    <option value="improve">General Improvement</option>
                    <option value="academic">More Academic</option>
                    <option value="professional">More Professional</option>
                    <option value="concise">Make Concise</option>
                </select>
            </div>
            
            <!-- AI Enhancement Widget -->
            <AIFeatureWidget 
                featureType="text_enhancement"
                content={selectedText}
                options={{ 
                    enhancementType: enhancementType,
                    context: context
                }}
                placeholder="Text will be enhanced automatically..."
                buttonText="✨ Enhance Text"
                showUsageInfo={false}
                on:success={handleEditSuccess}
            />
        </div>
    </div>
{/if}

<style>
    /* Add any custom styles here */
</style> 
