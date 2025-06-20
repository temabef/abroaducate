<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';

    export let show = false;
    export let existingSOPs: Array<{id: string, university_name: string, program_name: string}> = [];

    const dispatch = createEventDispatcher();

    let formData = {
        university_name: '',
        program_name: '',
        country: '',
        application_deadline: '',
        linked_sop_ids: []
    };

    let loading = false;
    let error = '';

    function closeModal() {
        show = false;
        resetForm();
    }

    function resetForm() {
        formData = {
            university_name: '',
            program_name: '',
            country: '',
            application_deadline: '',
            linked_sop_ids: []
        };
        error = '';
    }

    async function handleSubmit() {
        if (!formData.university_name || !formData.program_name) {
            error = 'University name and program name are required';
            return;
        }

        loading = true;
        error = '';

        try {
            const response = await fetch('/api/applications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                dispatch('applicationCreated', result.application);
                closeModal();
            } else {
                error = result.error || 'Failed to create application';
            }
        } catch (err) {
            error = 'Failed to create application';
            console.error('Error creating application:', err);
        } finally {
            loading = false;
        }
    }

    function handleSOPSelection(sopId: string, checked: boolean) {
        if (checked) {
            formData.linked_sop_ids = [...formData.linked_sop_ids, sopId];
        } else {
            formData.linked_sop_ids = formData.linked_sop_ids.filter(id => id !== sopId);
        }
    }
</script>

{#if show}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick={closeModal}>
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()} transition:slide>
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-semibold text-gray-900">Add New Application</h2>
                <button onclick={closeModal} class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
                <!-- University Name -->
                <div>
                    <label for="university" class="block text-sm font-medium text-gray-700 mb-1">
                        University Name *
                    </label>
                    <input
                        id="university"
                        type="text"
                        bind:value={formData.university_name}
                        placeholder="e.g., Stanford University"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <!-- Program Name -->
                <div>
                    <label for="program" class="block text-sm font-medium text-gray-700 mb-1">
                        Program Name *
                    </label>
                    <input
                        id="program"
                        type="text"
                        bind:value={formData.program_name}
                        placeholder="e.g., Master of Computer Science"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <!-- Country -->
                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
                        Country
                    </label>
                    <select
                        id="country"
                        bind:value={formData.country}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Country</option>
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="Australia">Australia</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="France">France</option>
                    </select>
                </div>

                <!-- Application Deadline -->
                <div>
                    <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">
                        Application Deadline
                    </label>
                    <input
                        id="deadline"
                        type="date"
                        bind:value={formData.application_deadline}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Link Existing SOPs -->
                {#if existingSOPs.length > 0}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Link Existing SOPs (Optional)
                        </label>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            {#each existingSOPs as sop}
                                <label class="flex items-center">
                                    <input
                                        type="checkbox"
                                        onchange={(e) => handleSOPSelection(sop.id, e.target.checked)}
                                        class="mr-2"
                                    />
                                    <span class="text-sm text-gray-700">
                                        {sop.university_name} - {sop.program_name}
                                    </span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Error Message -->
                {#if error}
                    <div class="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {error}
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        onclick={closeModal}
                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Application'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if} 