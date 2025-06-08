<script lang="ts">
	import { formStore } from '$lib/stores';
    import type { WorkExperience } from '$lib/types';

    function addWorkExperience() {
        formStore.update(s => ({
            ...s,
            workExperiences: [...s.workExperiences, { company: '', position: '', responsibilities: [''], companyDescription: '', skills: '', projects: '' }]
        }));
    }

    function removeWorkExperience(index: number) {
        formStore.update(s => ({
            ...s,
            workExperiences: s.workExperiences.filter((_, i) => i !== index)
        }));
    }

    function addResponsibility(expIndex: number) {
        formStore.update(s => {
            const newWorkExperiences = [...s.workExperiences];
            newWorkExperiences[expIndex].responsibilities.push('');
            return { ...s, workExperiences: newWorkExperiences };
        });
    }

    function removeResponsibility(expIndex: number, respIndex: number) {
        formStore.update(s => {
            const newWorkExperiences = [...s.workExperiences];
            newWorkExperiences[expIndex].responsibilities = newWorkExperiences[expIndex].responsibilities.filter((_, i) => i !== respIndex);
            return { ...s, workExperiences: newWorkExperiences };
        });
    }

    function handleProjectChange(index: number, field: string, value: string) {
        formStore.update(s => ({
            ...s,
            projects: s.projects.map((project, i) => 
                i === index ? { ...project, [field]: value } : project
            )
        }));
    }

    function addProject() {
        formStore.addProject();
    }

    function removeProject(index: number) {
        if ($formStore.projects.length > 1) {
            formStore.removeProject(index);
        }
    }
</script>

<div class="step-content">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Work Experience & Projects</h2>

    <!-- Work Experience Section -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">Work Experience</legend>
        
        <div class="form-group mb-4">
            <label class="checkbox-label">
                <input type="checkbox" bind:checked={$formStore.showWorkExperienceForm} class="mr-2">
                <span>I have work experience to show</span>
            </label>
        </div>

        {#if $formStore.showWorkExperienceForm}
            {#each $formStore.workExperiences as experience, expIndex}
                <div class="dynamic-item mb-4">
                    <div class="dynamic-item-header">
                        <h4 class="dynamic-item-title">Experience {expIndex + 1}</h4>
                        {#if $formStore.workExperiences.length > 1}
                            <button 
                                type="button" 
                                class="remove-button"
                                on:click={() => removeWorkExperience(expIndex)}
                                aria-label="Remove experience {expIndex + 1}"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        {/if}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label for="company-{expIndex}" class="form-label">
                                Company Name <span class="required-asterisk">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="company-{expIndex}" 
                                bind:value={experience.company} 
                                class="form-input" 
                                placeholder="e.g., Google, Microsoft"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <label for="position-{expIndex}" class="form-label">
                                Position <span class="required-asterisk">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="position-{expIndex}" 
                                bind:value={experience.position} 
                                class="form-input" 
                                placeholder="e.g., Software Engineer, Marketing Manager"
                                required
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-label">
                            Responsibilities <span class="required-asterisk">*</span>
                        </div>
                        {#each experience.responsibilities as responsibility, respIndex}
                            <div class="responsibility-item">
                                <input 
                                    type="text" 
                                    id="responsibility-{expIndex}-{respIndex}"
                                    bind:value={experience.responsibilities[respIndex]} 
                                    class="form-input responsibility-input" 
                                    placeholder="Describe your responsibility..."
                                    aria-label="Responsibility {respIndex + 1} for experience {expIndex + 1}"
                                    required
                                >
                                {#if experience.responsibilities.length > 1}
                                    <button 
                                        type="button"
                                        class="responsibility-remove"
                                        on:click={() => removeResponsibility(expIndex, respIndex)}
                                        aria-label="Remove responsibility"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                        </svg>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                        <button 
                            type="button"
                            class="add-responsibility-button"
                            on:click={() => addResponsibility(expIndex)}
                        >
                            + Add Responsibility
                        </button>
                    </div>
                </div>
            {/each}
            
            <button 
                type="button" 
                class="add-button"
                on:click={addWorkExperience}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Another Experience
            </button>
        {/if}
    </fieldset>

    <!-- Projects Section -->
    <fieldset class="form-section">
        <legend class="form-legend">Projects (Optional)</legend>
        <p class="section-description">Add personal, academic, or professional projects that demonstrate your skills and experience.</p>
        
        {#each $formStore.projects as project, index}
            <div class="dynamic-item mb-4">
                <div class="dynamic-item-header">
                    <h4 class="dynamic-item-title">Project {index + 1}</h4>
                    {#if $formStore.projects.length > 1}
                        <button 
                            type="button" 
                            class="remove-button"
                            on:click={() => removeProject(index)}
                            aria-label="Remove project {index + 1}"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                
                <div class="form-group mb-3">
                    <label for="project-title-{index}" class="form-label">Project Title</label>
                    <input 
                        type="text" 
                        id="project-title-{index}"
                        class="form-input" 
                        bind:value={project.title}
                        on:input={(e) => handleProjectChange(index, 'title', (e.target as HTMLInputElement).value)}
                        placeholder="e.g., E-commerce Website, Data Analysis Dashboard"
                    >
                </div>
                
                <div class="form-group mb-3">
                    <label for="project-description-{index}" class="form-label">Project Description</label>
                    <textarea 
                        id="project-description-{index}"
                        class="form-input textarea-input" 
                        bind:value={project.description}
                        on:input={(e) => handleProjectChange(index, 'description', (e.target as HTMLTextAreaElement).value)}
                        placeholder="Describe what the project does, your role, and the impact..."
                        rows="3"
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="project-technologies-{index}" class="form-label">Technologies Used (Optional)</label>
                    <input 
                        type="text" 
                        id="project-technologies-{index}"
                        class="form-input" 
                        bind:value={project.technologies}
                        on:input={(e) => handleProjectChange(index, 'technologies', (e.target as HTMLInputElement).value)}
                        placeholder="e.g., React, Node.js, Python, SQL"
                    >
                </div>
            </div>
        {/each}
        
        <button 
            type="button" 
            class="add-button"
            on:click={addProject}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Another Project
        </button>
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
        min-height: 4rem;
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

    /* Responsibility styling */
    .responsibility-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .responsibility-input {
        flex-grow: 1;
        margin-bottom: 0;
    }

    .responsibility-remove {
        background-color: #FEE2E2;
        color: #DC2626;
        border: 1px solid #FECACA;
        border-radius: 0.375rem;
        padding: 0.375rem;
        margin-left: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .responsibility-remove:hover {
        background-color: #FECACA;
        border-color: #FCA5A5;
    }

    .add-responsibility-button {
        color: #2563EB;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0.25rem 0;
        transition: color 0.2s;
    }

    .add-responsibility-button:hover {
        color: #1D4ED8;
        text-decoration: underline;
    }

    /* Checkbox styling */
    input[type="checkbox"] {
        margin-right: 0.5rem;
        accent-color: #3B82F6;
    }
</style> 