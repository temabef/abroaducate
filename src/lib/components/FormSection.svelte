<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { formStore, loadStateFromSessionStorage, saveStateToSessionStorage, pendingGeneration } from '$lib/stores';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { analytics } from '$lib/utils/posthog';
    import { programCatalog } from '$lib/copilot/data/program-catalog';

    import Step1 from './form/Step1_University.svelte';
    import Step2 from './form/Step2_Academics.svelte';
    import Step3 from './form/Step3_WorkExperience.svelte';
    import Step4 from './form/Step4_ExtraCurricular.svelte';

    let errors = $state<string[]>([]);

    onMount(() => {
        if (browser) {
            const savedState = loadStateFromSessionStorage();
            if (Object.keys(savedState).length > 0) {
                formStore.set({ ...get(formStore), ...savedState });
            }

            // AUTO-FILL Context from Strategy Board Handoff
            const urlParams = new URLSearchParams(window.location.search);
            const handoffProgramId = urlParams.get('programId');
            if (handoffProgramId) {
                const prefillProgram = programCatalog.find(p => p.id === handoffProgramId);
                if (prefillProgram) {
                    formStore.update(s => {
                        // Create a defensive deep copy of universityData so we don't accidentally wipe inner fields if defined
                        return {
                            ...s,
                            universityData: {
                                ...s.universityData,
                                university: prefillProgram.university,
                                country: prefillProgram.country,
                                program: prefillProgram.program_name
                            }
                        };
                    });
                }
            }

            const unsubscribe = formStore.subscribe(state => {
                saveStateToSessionStorage(state);
            });

            return () => unsubscribe();
        }
    });

    const totalSteps = 4;
    const steps = [
        { number: 1, label: 'University', component: Step1 },
        { number: 2, label: 'Academics', component: Step2 },
        { number: 3, label: 'Experience', component: Step3 },
        { number: 4, label: 'Activities', component: Step4 }
    ];
    const CurrentStepComponent = $derived(steps[$formStore.currentStep - 1].component);

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

<div id="form-section" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-6 sm:p-8">
    <!-- Stepper Navigation — compact pill tabs, always fits -->
    <div class="mb-6 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-1 flex-wrap">
            {#each steps as step, i}
                <button
                    onclick={() => goToStep(step.number)}
                    disabled={step.number > $formStore.currentStep}
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                        {$formStore.currentStep === step.number
                            ? 'bg-[#2C3580] text-white shadow-sm'
                            : $formStore.currentStep > step.number
                            ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'}"
                >
                    <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                        {$formStore.currentStep === step.number ? 'bg-white/20' : $formStore.currentStep > step.number ? 'bg-emerald-200' : 'bg-slate-200 text-slate-500'}">
                        {step.number}
                    </span>
                    {step.label}
                </button>
                {#if i < steps.length - 1}
                    <div class="w-4 h-px bg-slate-200 flex-shrink-0"></div>
                {/if}
            {/each}
        </div>
    </div>

    <!-- Dynamic Step Component -->
    <div class="form-content mb-8 min-h-[300px]">
        <CurrentStepComponent />
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
        <button onclick={prevStep} class="btn btn-secondary" disabled={$formStore.currentStep === 1}>Back</button>

        {#if $formStore.currentStep < totalSteps}
            <button onclick={nextStep} class="btn btn-primary">Next</button>
        {/if}
        {#if $formStore.currentStep === totalSteps}
            <button onclick={handleFinalSubmit} class="btn btn-primary bg-green-600 hover:bg-green-700">Generate SOP</button>
        {/if}
    </div>
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
</style>
