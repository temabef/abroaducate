<script lang="ts">
	import { formStore } from '$lib/stores';

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        formStore.update(s => ({
            ...s,
            academicData: {
                ...s.academicData,
                [target.name]: target.value
            }
        }));
    }

    function handleCourseChange(index: number, field: string, value: string) {
        formStore.update(s => ({
            ...s,
            relevantCourses: s.relevantCourses.map((course, i) => 
                i === index ? { ...course, [field]: value } : course
            )
        }));
    }

    function addCourse() {
        formStore.addRelevantCourse();
    }

    function removeCourse(index: number) {
        if ($formStore.relevantCourses.length > 1) {
            formStore.removeRelevantCourse(index);
        }
    }
</script>

<div class="step-content">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Academic Details</h2>

    <!-- Academic Details -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">Your Previous Academic Background</legend>
        <div class="form-group mb-4">
            <label for="degreeType" class="form-label">
                Degree Type <span class="required-asterisk">*</span>
            </label>
            <input 
                type="text" 
                id="degreeType" 
                name="degreeType" 
                class="form-input" 
                bind:value={$formStore.academicData.degreeType} 
                on:input={handleChange}
                placeholder="e.g., Bachelor of Science, Master of Arts" 
                required
            >
            {#if degreeTypeError}
                <div class="input-error">{degreeTypeError}</div>
            {/if}
        </div>
        <div class="form-group mb-4">
            <label for="fieldOfStudy" class="form-label">
                Field of Study <span class="required-asterisk">*</span>
            </label>
            <input 
                type="text" 
                id="fieldOfStudy" 
                name="fieldOfStudy" 
                class="form-input" 
                bind:value={$formStore.academicData.fieldOfStudy} 
                on:input={handleChange}
                placeholder="e.g., Computer Science, Psychology, Engineering" 
                required
            >
            {#if fieldOfStudyError}
                <div class="input-error">{fieldOfStudyError}</div>
            {/if}
        </div>
        <div class="form-group mb-4">
            <label for="universityName" class="form-label">
                University Name (from previous degree) <span class="required-asterisk">*</span>
            </label>
            <input 
                type="text" 
                id="universityName" 
                name="universityName" 
                class="form-input" 
                bind:value={$formStore.academicData.universityName} 
                on:input={handleChange}
                placeholder="e.g., University of Toronto, Delhi University" 
                required
            >
            {#if universityNameError}
                <div class="input-error">{universityNameError}</div>
            {/if}
        </div>
        <div class="form-group">
            <label for="gpa" class="form-label">GPA (Optional)</label>
            <input 
                type="text" 
                id="gpa" 
                name="gpa" 
                class="form-input" 
                bind:value={$formStore.academicData.gpa} 
                on:input={handleChange}
                placeholder="e.g., 3.8/4.0, 85%, First Class"
            >
        </div>
    </fieldset>

    <!-- Relevant Courses Section -->
    <fieldset class="form-section">
        <legend class="form-legend">Relevant Courses (Optional)</legend>
        <p class="section-description">Add courses that are relevant to your application program.</p>
        
        {#each $formStore.relevantCourses as course, index}
            <div class="dynamic-item mb-4">
                <div class="dynamic-item-header">
                    <h4 class="dynamic-item-title">Course {index + 1}</h4>
                    {#if $formStore.relevantCourses.length > 1}
                        <button 
                            type="button" 
                            class="remove-button"
                            on:click={() => removeCourse(index)}
                            aria-label="Remove course {index + 1}"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                
                <div class="form-group mb-3">
                    <label for="course-name-{index}" class="form-label">Course Name</label>
                    <input 
                        type="text" 
                        id="course-name-{index}"
                        class="form-input" 
                        bind:value={course.name}
                        on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (target) handleCourseChange(index, 'name', target.value);
                        }}
                        placeholder="e.g., Advanced Data Structures, Organic Chemistry"
                    >
                </div>
                
                <div class="form-group">
                    <label for="course-description-{index}" class="form-label">Course Description</label>
                    <textarea 
                        id="course-description-{index}"
                        class="form-input textarea-input" 
                        bind:value={course.description}
                        on:input={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            if (target) handleCourseChange(index, 'description', target.value);
                        }}
                        placeholder="Brief description of what you learned in this course..."
                        rows="2"
                    ></textarea>
                </div>
            </div>
        {/each}
        
        <button 
            type="button" 
            class="add-button"
            on:click={addCourse}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Another Course
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
        min-height: 3rem;
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

    .input-error {
        color: #DC2626;
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }
</style> 