<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';

    export let show = false;
    export let existingSOPs: Array<{id: string, university_name: string, program_name: string}> = [];

    const dispatch = createEventDispatcher();

    let formData: {
        university_name: string;
        program_name: string;
        country: string;
        application_deadline: string;
        application_link: string;
        notes: string;
        linked_sop_ids: string[];
    } = {
        university_name: '',
        program_name: '',
        country: '',
        application_deadline: '',
        application_link: '',
        notes: '',
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
            application_link: '',
            notes: '',
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
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick={closeModal}>
        <div class="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onclick={(e) => e.stopPropagation()} transition:slide>
            <div class="flex justify-between items-center p-6 pb-4 border-b">
                <h2 class="text-xl font-semibold text-gray-900">Add New Application</h2>
                <button onclick={closeModal} class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-4">
                <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-3">
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
                        <!-- Popular Study Destinations -->
                        <option value="United States">🇺🇸 United States</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="Canada">🇨🇦 Canada</option>
                        <option value="Australia">🇦🇺 Australia</option>
                        <option value="Germany">🇩🇪 Germany</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="Netherlands">🇳🇱 Netherlands</option>
                        <option value="Singapore">🇸🇬 Singapore</option>
                        <option value="Switzerland">🇨🇭 Switzerland</option>
                        <option value="Sweden">🇸🇪 Sweden</option>
                        <option value="Norway">🇳🇴 Norway</option>
                        <option value="Denmark">🇩🇰 Denmark</option>
                        <option value="Japan">🇯🇵 Japan</option>
                        <option value="South Korea">🇰🇷 South Korea</option>
                        <option value="New Zealand">🇳🇿 New Zealand</option>
                        <option value="Ireland">🇮🇪 Ireland</option>
                        <option value="Belgium">🇧🇪 Belgium</option>
                        <option value="Austria">🇦🇹 Austria</option>
                        <option value="Italy">🇮🇹 Italy</option>
                        <option value="Spain">🇪🇸 Spain</option>
                        <option value="Finland">🇫🇮 Finland</option>
                        <!-- Separator -->
                        <option disabled>──── Other Countries ────</option>
                        <!-- Other Countries Alphabetically -->
                        <option value="Argentina">Argentina</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Chile">Chile</option>
                        <option value="China">China</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Iceland">Iceland</option>
                        <option value="India">India</option>
                        <option value="Israel">Israel</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Russia">Russia</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
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

                <!-- Application Link -->
                <div>
                    <label for="application-link" class="block text-sm font-medium text-gray-700 mb-1">
                        Application Link/URL
                    </label>
                    <input
                        id="application-link"
                        type="url"
                        bind:value={formData.application_link}
                        placeholder="e.g., https://apply.university.edu/programs/ms-cs"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                        Application portal, program page, or relevant URL
                    </p>
                </div>

                <!-- Notes -->
                <div>
                    <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        bind:value={formData.notes}
                        placeholder="Personal notes, requirements, contacts, deadlines, etc."
                        rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                    <p class="text-xs text-gray-500 mt-1">
                        Personal thoughts, requirements, contacts, etc.
                    </p>
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
                                        onchange={(e) => handleSOPSelection(sop.id, (e.target as HTMLInputElement).checked)}
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

                </form>
                    </div>

            <!-- Action Buttons - Fixed at bottom -->
            <div class="border-t p-6 pt-4">
                <div class="flex gap-3">
                    <button
                        type="button"
                        onclick={closeModal}
                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSubmit}
                        disabled={loading}
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Application'}
                    </button>
                </div>

                <!-- Error Message -->
                {#if error}
                    <div class="text-red-600 text-sm bg-red-50 p-2 rounded mt-3">
                        {error}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if} 