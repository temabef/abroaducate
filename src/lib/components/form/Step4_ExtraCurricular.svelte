<script lang="ts">
    import { formStore } from '$lib/stores';

    // --- Organizations ---
    function addOrganization() {
        formStore.update(s => ({
            ...s,
            organizations: [...s.organizations, { name: '', role: '', description: '' }]
        }));
    }

    function removeOrganization(index: number) {
        formStore.update(s => ({
            ...s,
            organizations: s.organizations.filter((_, i) => i !== index)
        }));
    }

    // --- Community Service ---
    function addCommunityService() {
        formStore.update(s => ({
            ...s,
            communityServices: [...s.communityServices, { organization: '', role: '', impact: '' }]
        }));
    }

    function removeCommunityService(index: number) {
        formStore.update(s => ({
            ...s,
            communityServices: s.communityServices.filter((_, i) => i !== index)
        }));
    }

    // --- Achievements ---
    function handleAchievementChange(index: number, field: string, value: string) {
        formStore.update(s => ({
            ...s,
            achievements: s.achievements.map((achievement, i) => 
                i === index ? { ...achievement, [field]: value } : achievement
            )
        }));
    }

    function addAchievement() {
        formStore.addAchievement();
    }

    function removeAchievement(index: number) {
        if ($formStore.achievements.length > 1) {
            formStore.removeAchievement(index);
        }
    }
</script>

<div class="step-content">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Extra-Curricular Activities & Achievements</h2>

    <!-- Achievements Section -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">Achievements (Optional)</legend>
        <p class="section-description">Add academic, professional, or personal achievements that showcase your accomplishments.</p>
        
        {#each $formStore.achievements as achievement, index}
            <div class="dynamic-item mb-4">
                <div class="dynamic-item-header">
                    <h4 class="dynamic-item-title">Achievement {index + 1}</h4>
                    {#if $formStore.achievements.length > 1}
                        <button 
                            type="button" 
                            class="remove-button"
                            on:click={() => removeAchievement(index)}
                            aria-label="Remove achievement {index + 1}"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                
                <div class="form-group mb-3">
                    <label for="achievement-title-{index}" class="form-label">Achievement Title</label>
                    <input 
                        type="text" 
                        id="achievement-title-{index}"
                        class="form-input" 
                        bind:value={achievement.title}
                        on:input={(e) => handleAchievementChange(index, 'title', (e.target as HTMLInputElement).value)}
                        placeholder="e.g., Dean's List, Best Project Award, Published Research"
                    >
                </div>
                
                <div class="form-group mb-3">
                    <label for="achievement-description-{index}" class="form-label">Description</label>
                    <textarea 
                        id="achievement-description-{index}"
                        class="form-input textarea-input" 
                        bind:value={achievement.description}
                        on:input={(e) => handleAchievementChange(index, 'description', (e.target as HTMLTextAreaElement).value)}
                        placeholder="Describe the achievement and its significance..."
                        rows="2"
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="achievement-date-{index}" class="form-label">Date (Optional)</label>
                    <input 
                        type="text" 
                        id="achievement-date-{index}"
                        class="form-input" 
                        bind:value={achievement.date}
                        on:input={(e) => handleAchievementChange(index, 'date', (e.target as HTMLInputElement).value)}
                        placeholder="e.g., May 2023, 2022, Fall 2023"
                    >
                </div>
            </div>
        {/each}
        
        <button 
            type="button" 
            class="add-button"
            on:click={addAchievement}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Another Achievement
        </button>
    </fieldset>

    <!-- Organizations -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">Organizations</legend>
        <div class="form-group mb-4">
            <label class="checkbox-label">
                <input type="checkbox" bind:checked={$formStore.showOrganizationsForm} class="mr-2">
                <span>Involved in any organizations?</span>
            </label>
        </div>
        
        {#if $formStore.showOrganizationsForm}
            {#each $formStore.organizations as org, index}
                <div class="dynamic-item mb-4">
                    <div class="dynamic-item-header">
                        <h4 class="dynamic-item-title">Organization {index + 1}</h4>
                        {#if $formStore.organizations.length > 1}
                            <button 
                                type="button" 
                                class="remove-button"
                                on:click={() => removeOrganization(index)}
                                aria-label="Remove organization {index + 1}"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        {/if}
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="org-name-{index}" class="form-label">
                            Organization Name <span class="required-asterisk">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="org-name-{index}"
                            bind:value={org.name} 
                            class="form-input" 
                            placeholder="e.g., Student Council, Red Cross, Debate Club"
                            required
                        >
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="org-role-{index}" class="form-label">
                            Your Role <span class="required-asterisk">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="org-role-{index}"
                            bind:value={org.role} 
                            class="form-input" 
                            placeholder="e.g., President, Volunteer, Member"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="org-description-{index}" class="form-label">
                            Description <span class="required-asterisk">*</span>
                        </label>
                        <textarea 
                            id="org-description-{index}"
                            bind:value={org.description} 
                            class="form-input textarea-input" 
                            placeholder="Describe your involvement and contributions..."
                            rows="3"
                            required
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            <button 
                type="button" 
                class="add-button"
                on:click={addOrganization}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Another Organization
            </button>
        {/if}
    </fieldset>

    <!-- Community Service -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">Community Service</legend>
        <div class="form-group mb-4">
            <label class="checkbox-label">
                <input type="checkbox" bind:checked={$formStore.showCommunityServiceForm} class="mr-2">
                <span>Any community service?</span>
            </label>
        </div>
        
        {#if $formStore.showCommunityServiceForm}
            {#each $formStore.communityServices as service, index}
                <div class="dynamic-item mb-4">
                    <div class="dynamic-item-header">
                        <h4 class="dynamic-item-title">Service {index + 1}</h4>
                        {#if $formStore.communityServices.length > 1}
                            <button 
                                type="button" 
                                class="remove-button"
                                on:click={() => removeCommunityService(index)}
                                aria-label="Remove service {index + 1}"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        {/if}
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="service-org-{index}" class="form-label">
                            Organization <span class="required-asterisk">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="service-org-{index}"
                            bind:value={service.organization} 
                            class="form-input" 
                            placeholder="e.g., Local Food Bank, Animal Shelter"
                            required
                        >
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="service-role-{index}" class="form-label">
                            Your Role <span class="required-asterisk">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="service-role-{index}"
                            bind:value={service.role} 
                            class="form-input" 
                            placeholder="e.g., Volunteer, Coordinator, Tutor"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="service-impact-{index}" class="form-label">
                            Impact <span class="required-asterisk">*</span>
                        </label>
                        <textarea 
                            id="service-impact-{index}"
                            bind:value={service.impact} 
                            class="form-input textarea-input" 
                            placeholder="Describe the impact of your service..."
                            rows="3"
                            required
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            <button 
                type="button" 
                class="add-button"
                on:click={addCommunityService}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Another Service
            </button>
        {/if}
    </fieldset>

    <!-- Hobbies -->
    <fieldset class="form-section">
        <legend class="form-legend">Hobbies & Interests</legend>
        <div class="form-group mb-4">
            <label class="checkbox-label">
                <input type="checkbox" bind:checked={$formStore.showHobbiesForm} class="mr-2">
                <span>Want to add hobbies?</span>
            </label>
        </div>
        
        {#if $formStore.showHobbiesForm}
            <div class="form-group">
                <label for="hobbies" class="form-label">Hobbies & Interests</label>
                <textarea 
                    id="hobbies"
                    bind:value={$formStore.hobbies} 
                    class="form-input textarea-input" 
                    placeholder="List your hobbies and interests, separated by commas..."
                    rows="3"
                ></textarea>
            </div>
        {/if}
    </fieldset>
</div>

<style>
    /* Form styling */
    .form-legend {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1F2937;
        display: block;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
        font-size: 0.95rem;
    }

    .required-asterisk {
        color: #DC2626;
        font-weight: bold;
        margin-left: 2px;
    }
    
    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.375rem;
        transition: border-color 0.2s;
        font-size: 0.95rem;
        background-color: #FFFFFF;
    }
    
    .form-input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .form-input:hover {
        border-color: #9CA3AF;
    }

    .textarea-input {
        resize: vertical;
        min-height: 3rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 0.95rem;
        color: #374151;
        padding: 0.25rem 0;
    }

    .checkbox-label:hover {
        color: #1F2937;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-section {
        padding: 1rem;
        border: 1px solid #E5E7EB;
        border-radius: 0.5rem;
        background-color: #F9FAFB;
    }

    .section-description {
        color: #6B7280;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        font-style: italic;
    }

    .step-content {
        padding: 0.5rem 0;
    }

    .form-input::placeholder {
        color: #9CA3AF;
        font-style: italic;
    }

    /* Dynamic sections styling */
    .dynamic-item {
        padding: 1rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.5rem;
        background-color: #FFFFFF;
    }

    .dynamic-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .dynamic-item-title {
        font-weight: 600;
        color: #374151;
        font-size: 1rem;
    }

    .remove-button {
        background-color: #FEE2E2;
        color: #DC2626;
        border: 1px solid #FECACA;
        border-radius: 0.375rem;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-button:hover {
        background-color: #FECACA;
        border-color: #FCA5A5;
    }

    .add-button {
        background-color: #EFF6FF;
        color: #2563EB;
        border: 1px solid #DBEAFE;
        border-radius: 0.375rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        font-weight: 500;
    }

    .add-button:hover {
        background-color: #DBEAFE;
        border-color: #93C5FD;
    }

    /* Checkbox styling */
    input[type="checkbox"] {
        margin-right: 0.5rem;
        accent-color: #3B82F6;
    }
</style> 