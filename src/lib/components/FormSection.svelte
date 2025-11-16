<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { formStore, loadStateFromSessionStorage, saveStateToSessionStorage, pendingGeneration } from '$lib/stores';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { analytics } from '$lib/utils/posthog';

    import Step1 from './form/Step1_University.svelte';
    import Step2 from './form/Step2_Academics.svelte';
    import Step3 from './form/Step3_WorkExperience.svelte';
    import Step4 from './form/Step4_ExtraCurricular.svelte';

    let errors: string[] = [];

    onMount(() => {
        if (browser) {
            const savedState = loadStateFromSessionStorage();
            if (Object.keys(savedState).length > 0) {
                formStore.set({ ...get(formStore), ...savedState });
            }

            const unsubscribe = formStore.subscribe(state => {
                saveStateToSessionStorage(state);
            });

            return () => unsubscribe();
        }
    });

    const totalSteps = 4;
    const steps = [
        { number: 1, label: 'University & Goals', component: Step1 },
        { number: 2, label: 'Academic Background', component: Step2 },
        { number: 3, label: 'Work Experience', component: Step3 },
        { number: 4, label: 'Activities & Achievements', component: Step4 }
    ];

    // --- Navigation ---

    function nextStep() {
        if (validateStep(get(formStore).currentStep)) {
            if (get(formStore).currentStep < totalSteps) {
                formStore.update(s => ({ ...s, currentStep: s.currentStep + 1 }));
                // Smooth scroll to top of form section
                setTimeout(() => {
                    const formSection = document.getElementById('form-section');
                    if (formSection) {
                        formSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 50);
            }
        }
    }

    function prevStep() {
        if (get(formStore).currentStep > 1) {
            formStore.update(s => ({ ...s, currentStep: s.currentStep - 1 }));
            // Smooth scroll to top of form section
            setTimeout(() => {
                const formSection = document.getElementById('form-section');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 50);
        }
    }

    function goToStep(stepNumber: number) {
        // Allow backward navigation freely
        if (stepNumber < get(formStore).currentStep) {
             formStore.update(s => ({ ...s, currentStep: stepNumber }));
             // Smooth scroll to top of form section
             setTimeout(() => {
                 const formSection = document.getElementById('form-section');
                 if (formSection) {
                     formSection.scrollIntoView({ behavior: 'smooth' });
                 }
             }, 50);
             return;
        }
        // For forward navigation, validate all steps up to the target
        let canProceed = true;
        for (let i = 1; i < stepNumber; i++) {
            if (!validateStep(i)) {
                canProceed = false;
                break;
            }
        }
        if (canProceed) {
            formStore.update(s => ({ ...s, currentStep: stepNumber }));
            // Smooth scroll to top of form section
            setTimeout(() => {
                const formSection = document.getElementById('form-section');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 50);
        }
    }

    // --- Validation ---

    function validateStep(step: number): boolean {
        errors = [];
        const state = get(formStore);

        if (step === 1) {
            if (!state.universityData.university.trim()) errors.push('University Name is required.');
            if (!state.universityData.country.trim()) errors.push('Country is required.');
            if (!state.universityData.program.trim()) errors.push('Program is required.');
            if (state.selectedAspirations.length === 0 && !state.isBestChoiceSelected) {
                errors.push('Please select at least one aspiration option.');
            }
            if (state.isBestChoiceSelected && !state.customAspiration.trim()) {
                errors.push('Please provide your custom aspiration.');
            }
            if (!state.isCustomQuality && state.selectedQualities.length === 0) {
                errors.push('Please select at least one quality.');
            }
            if (state.isCustomQuality && !state.customQualityReason.trim()) {
                errors.push('Please provide a reason for your custom quality.');
            }
        } else if (step === 2) {
             if (!state.academicData.degreeType.trim()) errors.push('Degree Type is required.');
            if (!state.academicData.fieldOfStudy.trim()) errors.push('Field of Study is required.');
            if (!state.academicData.universityName.trim()) errors.push('University Name is required.');
        } else if (step === 3) {
            if (state.showWorkExperienceForm) {
                state.workExperiences.forEach((exp, index) => {
                    if (!exp.company.trim()) errors.push(`Work Experience ${index + 1}: Company Name is required.`);
                    if (!exp.position.trim()) errors.push(`Work Experience ${index + 1}: Position is required.`);
                    if (exp.responsibilities.some(r => !r.trim())) errors.push(`Work Experience ${index + 1}: All responsibilities must be filled.`);
                });
            }
        } else if (step === 4) {
             if (state.showOrganizationsForm) {
                state.organizations.forEach((org, index) => {
                    if (!org.name.trim()) errors.push(`Organization ${index + 1}: Name is required.`);
                    if (!org.role.trim()) errors.push(`Organization ${index + 1}: Role is required.`);
                    if (!org.description.trim()) errors.push(`Organization ${index + 1}: Description is required.`);
                });
            }
            if (state.showCommunityServiceForm) {
                state.communityServices.forEach((service, index) => {
                    if (!service.organization.trim()) errors.push(`Community Service ${index + 1}: Organization is required.`);
                    if (!service.role.trim()) errors.push(`Community Service ${index + 1}: Role is required.`);
                    if (!service.impact.trim()) errors.push(`Community Service ${index + 1}: Impact is required.`);
                });
            }
        }

        return errors.length === 0;
    }

    function handleFinalSubmit() {
        // Validate the final step before proceeding
        const isValid = validateStep(get(formStore).currentStep);
        
        if (!isValid) {
            alert('Please fix the errors before proceeding.');
            return;
        }
        
        // Track SOP form submission
        const currentState = get(formStore);
        analytics.trackFormSubmission('SOP Generation', {
            university: currentState.universityData.university,
            program: currentState.universityData.program,
            country: currentState.universityData.country,
            has_work_experience: currentState.showWorkExperienceForm,
            has_organizations: currentState.showOrganizationsForm,
            has_community_service: currentState.showCommunityServiceForm
        });
        
        // Save final state and set pending generation flag
        saveStateToSessionStorage(currentState);
        pendingGeneration.set(true);
        
        // Redirect to the submission page
        goto('/submit-sop').then(() => {
            // Success
        }).catch((error) => {
            console.error('Navigation failed:', error);
        });
    }
</script>

<div id="form-section" class="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-xl my-8">
    
    <!-- AI Usage Disclaimer -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
            <span class="text-xl">🤖</span>
            <div class="text-sm text-[#2C3580]">
                <div class="font-semibold mb-1">AI-Powered Guidance Tool</div>
                <p class="leading-relaxed">
                    This form helps generate an SOP draft to <strong>guide your writing process</strong>. 
                    The AI output should be thoroughly reviewed, personalized, and adapted to reflect your unique voice 
                    before submission to any academic institution.
                </p>
            </div>
        </div>
    </div>

    <!-- Main Title -->
    <div class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Ready to Generate Your SOP</h1>
        <p class="text-lg text-gray-600">Complete the form below to create your personalized Statement of Purpose</p>
    </div>

    <!-- Stepper Navigation -->
    <div class="mb-8">
        <!-- Mobile Stepper (stacked) -->
        <div class="sm:hidden">
            <div class="flex items-center justify-center mb-4">
                <div class="text-sm text-gray-600">
                    Step {$formStore.currentStep} of {totalSteps}
                </div>
            </div>
            <div class="flex items-center justify-center">
                {#each steps as step, i}
                    <button
                        class="step-button-mobile"
                        class:active={$formStore.currentStep === step.number}
                        class:completed={$formStore.currentStep > step.number}
                        on:click={() => goToStep(step.number)}
                    >
                        {step.number}
                    </button>
                    {#if i < steps.length - 1}
                        <div class="step-connector-mobile" class:active-connector={$formStore.currentStep > i + 1}></div>
                    {/if}
                {/each}
            </div>
            <div class="text-center mt-2">
                <div class="text-sm font-medium text-gray-700">
                    {steps[$formStore.currentStep - 1].label}
                </div>
            </div>
        </div>

        <!-- Desktop Stepper (horizontal with labels) -->
        <div class="hidden sm:flex items-center justify-center">
            {#each steps as step, i}
                <div class="flex items-center">
                    <button
                        class="step-button"
                        class:active={$formStore.currentStep === step.number}
                        class:completed={$formStore.currentStep > step.number}
                        on:click={() => goToStep(step.number)}
                    >
                        {step.number}
                    </button>
                    <span class="step-label" class:active-label={$formStore.currentStep === step.number}>{step.label}</span>
                </div>
                {#if i < steps.length - 1}
                    <div class="step-connector" class:active-connector={$formStore.currentStep > i + 1}></div>
                {/if}
            {/each}
        </div>
    </div>



    <!-- Dynamic Step Component -->
    <div class="form-content mb-8 min-h-[300px]">
        <svelte:component this={steps[$formStore.currentStep - 1].component} />
    </div>

    <!-- Validation Errors -->
    {#if errors.length > 0}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong class="font-bold">Please fix the following errors:</strong>
            <ul class="mt-2 list-disc list-inside">
                {#each errors as error}
                    <li>{error}</li>
                {/each}
            </ul>
        </div>
    {/if}

    <!-- Navigation Buttons -->
    <div class="flex justify-between items-center mt-8 pt-6 border-t">
        <button on:click={prevStep} class="btn btn-secondary" disabled={$formStore.currentStep === 1}>Back</button>

        {#if $formStore.currentStep < totalSteps}
            <button on:click={nextStep} class="btn btn-primary">Next</button>
        {/if}
        {#if $formStore.currentStep === totalSteps}
            <button on:click={handleFinalSubmit} class="btn btn-primary bg-green-600 hover:bg-green-700">Generate SOP</button>
        {/if}
    </div>
</div>

<style>
.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}
.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.btn-primary {
    background-color: #2C3580;
    color: white;
}
.btn-primary:hover:not(:disabled) {
    background-color: #3c4d9c;
}
.btn-secondary {
    background-color: #E5E7EB;
    color: #374151;
}
.btn-secondary:hover:not(:disabled) {
    background-color: #D1D5DB;
}
.step-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 2px solid #D1D5DB;
    background-color: white;
    color: #6B7280;
    font-weight: bold;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
.step-button.active {
    background-color: #2C3580;
    color: white;
    border-color: #2C3580;
}
.step-button.completed {
    background-color: #16A34A;
    border-color: #16A34A;
    color: white;
}
.step-label {
    margin-left: 0.5rem;
    white-space: nowrap;
    color: #6B7280;
}
.step-label.active-label {
    color: #2C3580;
    font-weight: 600;
}
.step-connector {
    flex-grow: 1;
    height: 2px;
    background-color: #D1D5DB;
    margin: 0 0.5rem;
}
.step-connector.active-connector {
    background-color: #2C3580;
}

/* Mobile Stepper Styles */
.step-button-mobile {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid #D1D5DB;
    background-color: white;
    color: #6B7280;
    font-weight: bold;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
}
.step-button-mobile.active {
    background-color: #2C3580;
    color: white;
    border-color: #2C3580;
}
.step-button-mobile.completed {
    background-color: #16A34A;
    border-color: #16A34A;
    color: white;
}
.step-connector-mobile {
    width: 1.5rem;
    height: 2px;
    background-color: #D1D5DB;
    margin: 0 0.25rem;
}
.step-connector-mobile.active-connector {
    background-color: #2C3580;
}
</style>
