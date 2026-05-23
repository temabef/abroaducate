<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { handleUpgradeRequired } from '$lib/services/upgradeService';
    import { personalStatementFormStore, savePersonalStatementStateToSessionStorage, personalStatementPendingGeneration } from '$lib/stores/personalStatementStore';
    import { get } from 'svelte/store';
    import { GraduationCap, Trophy, Scale, Stethoscope, Globe, Briefcase, PenLine, Sparkles, Clipboard, Save, RefreshCw, AlertTriangle } from 'lucide-svelte';
    
    export let existingUserData: any = null;
    export let existingSOPData: any = null;
    const dispatch = createEventDispatcher();
    
    interface PersonalStatementData {
        applicationType: 'undergraduate' | 'scholarship' | 'law_school' | 'medical_school' | 'study_abroad' | 'professional';
        institutionName: string;
        programName: string;
        applicationDeadline?: string;
        wordLimit?: number;
        personalInfo: {
            name: string;
            email: string;
            currentEducation: string;
            hometown: string;
        };
        personalDetails: {
            // Core story elements
            formativeExperience: string;
            challengesOvercome: string;
            valuesAndBeliefs: string;
            passionsAndInterests: string;
            communityImpact: string;
            futureGoals: string;
            whyThisProgram: string;
            // Application-specific fields
            academicInterests?: string; // For undergraduate
            needExplanation?: string; // For scholarships
            legalInterest?: string; // For law school
            serviceExperience?: string; // For medical school
            culturalGoals?: string; // For study abroad
            leadershipExperience?: string; // For professional programs
        };
        customRequests?: string;
    }
    
    let generating = false;
    let currentStep = 1;
    let totalSteps = 4;
    let generatedPersonalStatement = '';
    let personalStatementData: PersonalStatementData = {
        applicationType: 'undergraduate',
        institutionName: '',
        programName: '',
        personalInfo: {
            name: '',
            email: '',
            currentEducation: '',
            hometown: ''
        },
        personalDetails: {
            formativeExperience: '',
            challengesOvercome: '',
            valuesAndBeliefs: '',
            passionsAndInterests: '',
            communityImpact: '',
            futureGoals: '',
            whyThisProgram: ''
        }
    };
    
    // Validation error states
    let nameError = '';
    let emailError = '';
    let currentEducationError = '';
    let hometownError = '';
    let institutionNameError = '';
    let programNameError = '';
    let formativeExperienceError = '';
    let challengesOvercomeError = '';
    let valuesAndBeliefsError = '';
    let passionsAndInterestsError = '';
    let communityImpactError = '';
    let futureGoalsError = '';
    let whyThisProgramError = '';
    let academicInterestsError = '';
    let needExplanationError = '';
    let legalInterestError = '';
    let serviceExperienceError = '';
    let culturalGoalsError = '';
    let leadershipExperienceError = '';
    
    // Validation functions
    function validateName() {
        const name = personalStatementData.personalInfo.name.trim();
        if (!name) {
            nameError = 'Full name is required';
        } else if (name.length < 2) {
            nameError = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            nameError = 'Name should only contain letters and spaces';
        } else {
            nameError = '';
        }
    }
    
    function validateEmail() {
        const email = personalStatementData.personalInfo.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            emailError = 'Email is required';
        } else if (!emailRegex.test(email)) {
            emailError = 'Please enter a valid email address';
        } else {
            emailError = '';
        }
    }
    
    function validateCurrentEducation() {
        const education = personalStatementData.personalInfo.currentEducation.trim();
        if (!education) {
            currentEducationError = 'Current education level is required';
        } else if (education.length < 3) {
            currentEducationError = 'Education level must be at least 3 characters';
        } else {
            currentEducationError = '';
        }
    }
    
    function validateHometown() {
        const hometown = personalStatementData.personalInfo.hometown.trim();
        if (!hometown) {
            hometownError = 'Hometown is required';
        } else if (hometown.length < 3) {
            hometownError = 'Hometown must be at least 3 characters';
        } else {
            hometownError = '';
        }
    }
    
    function validateInstitutionName() {
        const institution = personalStatementData.institutionName.trim();
        if (!institution) {
            institutionNameError = 'Institution name is required';
        } else if (institution.length < 2) {
            institutionNameError = 'Institution name must be at least 2 characters';
        } else {
            institutionNameError = '';
        }
    }
    
    function validateProgramName() {
        const program = personalStatementData.programName.trim();
        if (!program) {
            programNameError = 'Program name is required';
        } else if (program.length < 3) {
            programNameError = 'Program name must be at least 3 characters';
        } else {
            programNameError = '';
        }
    }
    
    function validateFormativeExperience() {
        const experience = personalStatementData.personalDetails.formativeExperience.trim();
        if (!experience) {
            formativeExperienceError = 'Formative experience is required';
        } else if (experience.length < 20) {
            formativeExperienceError = 'Formative experience must be at least 20 characters';
        } else {
            formativeExperienceError = '';
        }
    }
    
    function validateChallengesOvercome() {
        const challenges = personalStatementData.personalDetails.challengesOvercome.trim();
        if (!challenges) {
            challengesOvercomeError = 'Challenges overcome is required';
        } else if (challenges.length < 15) {
            challengesOvercomeError = 'Challenges must be at least 15 characters';
        } else {
            challengesOvercomeError = '';
        }
    }
    
    function validateValuesAndBeliefs() {
        const values = personalStatementData.personalDetails.valuesAndBeliefs.trim();
        if (!values) {
            valuesAndBeliefsError = 'Values and beliefs are required';
        } else if (values.length < 15) {
            valuesAndBeliefsError = 'Values and beliefs must be at least 15 characters';
        } else {
            valuesAndBeliefsError = '';
        }
    }
    
    function validatePassionsAndInterests() {
        const passions = personalStatementData.personalDetails.passionsAndInterests.trim();
        if (!passions) {
            passionsAndInterestsError = 'Passions and interests are required';
        } else if (passions.length < 15) {
            passionsAndInterestsError = 'Passions and interests must be at least 15 characters';
        } else {
            passionsAndInterestsError = '';
        }
    }
    
    function validateCommunityImpact() {
        const impact = personalStatementData.personalDetails.communityImpact.trim();
        if (!impact) {
            communityImpactError = 'Community impact is required';
        } else if (impact.length < 15) {
            communityImpactError = 'Community impact must be at least 15 characters';
        } else {
            communityImpactError = '';
        }
    }
    
    function validateFutureGoals() {
        const goals = personalStatementData.personalDetails.futureGoals.trim();
        if (!goals) {
            futureGoalsError = 'Future goals are required';
        } else if (goals.length < 15) {
            futureGoalsError = 'Future goals must be at least 15 characters';
        } else {
            futureGoalsError = '';
        }
    }
    
    function validateWhyThisProgram() {
        const why = personalStatementData.personalDetails.whyThisProgram.trim();
        if (!why) {
            whyThisProgramError = 'Why this program is required';
        } else if (why.length < 20) {
            whyThisProgramError = 'Why this program must be at least 20 characters';
        } else {
            whyThisProgramError = '';
        }
    }
    
    // Validate all fields for current step
    function validateCurrentStep() {
        if (currentStep === 1) {
            validateName();
            validateEmail();
            validateCurrentEducation();
            validateHometown();
        } else if (currentStep === 2) {
            validateInstitutionName();
            validateProgramName();
        } else if (currentStep === 3) {
            validateFormativeExperience();
            validateChallengesOvercome();
            validateValuesAndBeliefs();
            validatePassionsAndInterests();
            validateCommunityImpact();
            validateFutureGoals();
            validateWhyThisProgram();
        }
    }
    
    // Check if current step is valid
    function isCurrentStepValid(): boolean {
        validateCurrentStep();
        if (currentStep === 1) {
            return !nameError && !emailError && !currentEducationError && !hometownError;
        } else if (currentStep === 2) {
            return !institutionNameError && !programNameError;
        } else if (currentStep === 3) {
            return !formativeExperienceError && !challengesOvercomeError && 
                   !valuesAndBeliefsError && !passionsAndInterestsError && 
                   !communityImpactError && !futureGoalsError && !whyThisProgramError;
        }
        return true;
    }
    
    // Application type options
    const applicationTypes = [
        { value: 'undergraduate', label: 'Undergraduate Application', description: 'College admissions, university applications', color: 'from-blue-500 to-[#2C3580]', wordLimits: [250, 500, 650, 1000], icon: GraduationCap },
        { value: 'scholarship', label: 'Scholarship Application', description: 'Merit-based, need-based, specialty scholarships', color: 'from-yellow-500 to-orange-600', wordLimits: [250, 500, 750, 1000], icon: Trophy },
        { value: 'law_school', label: 'Law School Application', description: 'JD programs, legal studies', color: 'from-gray-600 to-gray-800', wordLimits: [500, 750, 1000, 1500], icon: Scale },
        { value: 'medical_school', label: 'Medical School Application', description: 'MD, DO, medical programs', color: 'from-red-500 to-pink-600', wordLimits: [500, 750, 1000, 1500], icon: Stethoscope },
        { value: 'study_abroad', label: 'Study Abroad Application', description: 'Exchange programs, international study', color: 'from-green-500 to-teal-600', wordLimits: [250, 500, 750, 1000], icon: Globe },
        { value: 'professional', label: 'Professional Program', description: 'MBA, specialized degrees, professional certificates', color: 'from-purple-500 to-violet-600', wordLimits: [500, 750, 1000, 1500], icon: Briefcase }
    ];
    
    // Pre-populate from existing data
    if (existingUserData) {
        personalStatementData.personalInfo = {
            name: existingUserData.name || '',
            email: existingUserData.email || '',
            currentEducation: existingUserData.currentEducation || '',
            hometown: existingUserData.hometown || ''
        };
    }
    
    // Extract personal elements from SOP if available
    if (existingSOPData) {
        personalStatementData.personalDetails.futureGoals = extractGoalsFromSOP(existingSOPData.content);
        personalStatementData.personalDetails.passionsAndInterests = extractPassionsFromSOP(existingSOPData.content);
    }
    
    function extractGoalsFromSOP(content: string): string {
        const sentences = content.split('.').filter(s => s.length > 20);
        const goalKeywords = ['goal', 'aim', 'aspire', 'hope', 'plan', 'future', 'career'];
        return sentences.filter(s => 
            goalKeywords.some(keyword => s.toLowerCase().includes(keyword))
        ).slice(0, 2).join('. ') + '.';
    }
    
    function extractPassionsFromSOP(content: string): string {
        const sentences = content.split('.').filter(s => s.length > 15);
        const passionKeywords = ['passionate', 'love', 'enjoy', 'fascinated', 'interested', 'drawn'];
        return sentences.filter(s => 
            passionKeywords.some(keyword => s.toLowerCase().includes(keyword))
        ).slice(0, 2).join('. ') + '.';
    }
    
    function nextStep() {
        if (currentStep < totalSteps && isCurrentStepValid()) {
            currentStep++;
        }
    }
    
    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
    
    async function generatePersonalStatement() {
        console.log('=== PERSONAL STATEMENT GENERATION START ===');
        console.log('Generate Personal Statement button clicked');
        console.log('Current form data:', personalStatementData);
        
        // Update the store with current form data
        personalStatementFormStore.set(personalStatementData);
        
        // Save form data to session storage
        savePersonalStatementStateToSessionStorage(personalStatementData);
        console.log('✓ Personal statement data saved to session storage');
        
        // Set pending generation flag
        personalStatementPendingGeneration.set(true);
        console.log('✓ Pending generation set to true');
        
        console.log('About to redirect to /submit-personal-statement');
        
        // Redirect to the submission page
        goto('/submit-personal-statement').then(() => {
            console.log('✓ goto completed successfully');
        }).catch((error) => {
            console.error('✗ goto failed:', error);
        });
        
        console.log('=== PERSONAL STATEMENT GENERATION END ===');
    }
    
    async function savePersonalStatement() {
        try {
            console.log('Starting save process...');
            const response = await fetch('/api/save-personal-statement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...personalStatementData,
                    generatedContent: generatedPersonalStatement,
                    wordCount: generatedPersonalStatement.split(' ').length
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Save error:', errorData);
                throw new Error(errorData.error || 'Failed to save personal statement');
            }
            
            const result = await response.json();
            console.log('Save result:', result);
            const { personalStatementId } = result;
            
            if (!personalStatementId) {
                throw new Error('No personal statement ID returned from save');
            }
            
            console.log('Redirecting to edit page:', `/personal-statements/${personalStatementId}`);
            
            // Use goto instead of window.location for better SvelteKit handling
            await goto(`/personal-statements/${personalStatementId}`);
            
        } catch (error) {
            console.error('Error saving personal statement:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save personal statement. Please try again.';
            alert(errorMessage);
        }
    }

    
    function startOver() {
        currentStep = 1;
        generatedPersonalStatement = '';
        personalStatementData = {
            applicationType: 'undergraduate',
            institutionName: '',
            programName: '',
            personalInfo: {
                name: personalStatementData.personalInfo.name,
                email: personalStatementData.personalInfo.email,
                currentEducation: '',
                hometown: ''
            },
            personalDetails: {
                formativeExperience: '',
                challengesOvercome: '',
                valuesAndBeliefs: '',
                passionsAndInterests: '',
                communityImpact: '',
                futureGoals: '',
                whyThisProgram: ''
            }
        };
    }
    
    async function copyPersonalStatement() {
        try {
            await navigator.clipboard.writeText(generatedPersonalStatement);
            alert('Personal statement copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy. Please select and copy manually.');
        }
    }
    
    function getStepTitle(step: number): string {
        const titles = {
            1: 'Application Type & Basic Info',
            2: 'Program Details',
            3: 'Your Personal Story',
            4: 'Review & Generate'
        };
        return titles[step as keyof typeof titles] || 'Complete';
    }
    
    function getApplicationTypeColor(type: string): string {
        const selectedType = applicationTypes.find(t => t.value === type);
        return selectedType?.color || 'from-gray-500 to-gray-600';
    }
    
    function getWordLimitOptions(type: string): number[] {
        const selectedType = applicationTypes.find(t => t.value === type);
        return selectedType?.wordLimits || [500, 750, 1000];
    }
</script>

<div class="personal-statement-generator">
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#2C3580] to-[#2C3580] text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold mb-2 flex items-center gap-2"><PenLine size={22} /> Personal Statement Generator</h2>
        <p class="opacity-90">Create compelling personal statements that tell your unique story</p>
        
        {#if currentStep <= totalSteps}
            <!-- Progress Bar -->
            <div class="mt-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm">Step {currentStep} of {totalSteps}</span>
                    <span class="text-sm">{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div class="w-full bg-white/20 rounded-full h-2">
                    <div 
                        class="bg-white h-2 rounded-full transition-all duration-300"
                        style="width: {(currentStep / totalSteps) * 100}%"
                    ></div>
                </div>
                <p class="text-sm mt-2 opacity-90">{getStepTitle(currentStep)}</p>
            </div>
        {/if}
    </div>
    
    <!-- Main Content -->
    <div class="bg-white border-l border-r border-b rounded-b-lg">
        {#if currentStep === 1}
            <!-- Step 1: Application Type Selection -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">What type of application is this for?</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {#each applicationTypes as applicationType}
                        <label class={`relative overflow-hidden rounded-lg  cursor-pointer transition-all ${
                            personalStatementData.applicationType === applicationType.value 
                                ? ' shadow-xl transform scale-105' 
                                : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                        }`}>
                            <input 
                                type="radio" 
                                bind:group={personalStatementData.applicationType} 
                                value={applicationType.value}
                                class="sr-only"
                            />
                            <div class={`bg-gradient-to-r ${applicationType.color} p-4 text-white`}>
                                <div class="flex items-center gap-2 font-bold text-lg mb-1">
                                    <svelte:component this={applicationType.icon} size={18} />
                                    {applicationType.label}
                                </div>
                                <div class="text-sm opacity-90">{applicationType.description}</div>
                            </div>
                        </label>
                    {/each}
                </div>
                
                <!-- Personal Information -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="ps-full-name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                id="ps-full-name"
                                type="text" 
                                bind:value={personalStatementData.personalInfo.name}
                                oninput={validateName}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Your full name"
                            />
                            {#if nameError}
                                <p class="text-red-500 text-sm mt-1">{nameError}</p>
                            {/if}
                        </div>
                        <div>
                            <label for="ps-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                id="ps-email"
                                type="email" 
                                bind:value={personalStatementData.personalInfo.email}
                                oninput={validateEmail}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="your.email@example.com"
                            />
                            {#if emailError}
                                <p class="text-red-500 text-sm mt-1">{emailError}</p>
                            {/if}
                        </div>
                        <div>
                            <label for="ps-education" class="block text-sm font-medium text-gray-700 mb-1">Current Education Level</label>
                            <input 
                                id="ps-education"
                                type="text" 
                                bind:value={personalStatementData.personalInfo.currentEducation}
                                oninput={validateCurrentEducation}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., High School Senior, College Junior"
                            />
                            {#if currentEducationError}
                                <p class="text-red-500 text-sm mt-1">{currentEducationError}</p>
                            {/if}
                        </div>
                        <div>
                            <label for="ps-hometown" class="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
                            <input 
                                id="ps-hometown"
                                type="text" 
                                bind:value={personalStatementData.personalInfo.hometown}
                                oninput={validateHometown}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="City, State/Country"
                            />
                            {#if hometownError}
                                <p class="text-red-500 text-sm mt-1">{hometownError}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 2}
            <!-- Step 2: Program Details -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Program Details</h3>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="ps-institution" class="block text-sm font-medium text-gray-700 mb-1">
                                {personalStatementData.applicationType === 'scholarship' ? 'Scholarship/Organization' : 'Institution'}
                            </label>
                            <input 
                                id="ps-institution"
                                type="text" 
                                bind:value={personalStatementData.institutionName}
                                oninput={validateInstitutionName}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={personalStatementData.applicationType === 'scholarship' ? 'e.g., Gates Foundation, Merit Scholarship' : 'e.g., Harvard University'}
                            />
                            {#if institutionNameError}
                                <p class="text-red-500 text-sm mt-1">{institutionNameError}</p>
                            {/if}
                        </div>
                        <div>
                            <label for="ps-program" class="block text-sm font-medium text-gray-700 mb-1">
                                {personalStatementData.applicationType === 'scholarship' ? 'Scholarship Type' : 'Program/Major'}
                            </label>
                            <input 
                                id="ps-program"
                                type="text" 
                                bind:value={personalStatementData.programName}
                                oninput={validateProgramName}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={personalStatementData.applicationType === 'scholarship' ? 'e.g., Need-based, Academic Excellence' : 'e.g., Computer Science, Pre-Med'}
                            />
                            {#if programNameError}
                                <p class="text-red-500 text-sm mt-1">{programNameError}</p>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="ps-deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline (Optional)</label>
                            <input 
                                id="ps-deadline"
                                type="date" 
                                bind:value={personalStatementData.applicationDeadline}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label for="ps-word-limit" class="block text-sm font-medium text-gray-700 mb-1">Word Limit</label>
                            <select 
                                id="ps-word-limit"
                                bind:value={personalStatementData.wordLimit}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Select word limit</option>
                                {#each getWordLimitOptions(personalStatementData.applicationType) as limit}
                                    <option value={limit}>{limit} words</option>
                                {/each}
                                <option value="custom">Custom limit</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 3}
            <!-- Step 3: Personal Story -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Your Personal Story</h3>
                <p class="text-gray-600 mb-6">Share the experiences and values that make you unique. Be authentic and specific.</p>
                
                <div class="space-y-4">
                    <div>
                        <label for="ps-formative" class="block text-sm font-medium text-gray-700 mb-1">Formative Experience</label>
                        <textarea 
                            id="ps-formative"
                            bind:value={personalStatementData.personalDetails.formativeExperience}
                            rows="4"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Describe a key experience that shaped who you are today..."
                        ></textarea>
                    </div>
                    
                    <div>
                        <label for="ps-challenges" class="block text-sm font-medium text-gray-700 mb-1">Challenges Overcome</label>
                        <textarea 
                            id="ps-challenges"
                            bind:value={personalStatementData.personalDetails.challengesOvercome}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="What obstacles have you faced and how did you overcome them?"
                        ></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="ps-values" class="block text-sm font-medium text-gray-700 mb-1">Core Values & Beliefs</label>
                            <textarea 
                                id="ps-values"
                                bind:value={personalStatementData.personalDetails.valuesAndBeliefs}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="What principles guide your life?"
                            ></textarea>
                        </div>
                        <div>
                            <label for="ps-passions" class="block text-sm font-medium text-gray-700 mb-1">Passions & Interests</label>
                            <textarea 
                                id="ps-passions"
                                bind:value={personalStatementData.personalDetails.passionsAndInterests}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="What drives and excites you?"
                            ></textarea>
                        </div>
                    </div>
                    
                    <!-- Application-specific fields -->
                    {#if personalStatementData.applicationType === 'scholarship'}
                        <div>
                            <label for="ps-need" class="block text-sm font-medium text-gray-700 mb-1">Financial Need/Merit Explanation</label>
                            <textarea 
                                id="ps-need"
                                bind:value={personalStatementData.personalDetails.needExplanation}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Explain your financial situation or merit-based qualifications..."
                            ></textarea>
                        </div>
                    {:else if personalStatementData.applicationType === 'medical_school'}
                        <div>
                            <label for="ps-service" class="block text-sm font-medium text-gray-700 mb-1">Service & Healthcare Experience</label>
                            <textarea 
                                id="ps-service"
                                bind:value={personalStatementData.personalDetails.serviceExperience}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Describe your healthcare exposure and service experiences..."
                            ></textarea>
                        </div>
                    {:else if personalStatementData.applicationType === 'law_school'}
                        <div>
                            <label for="ps-legal" class="block text-sm font-medium text-gray-700 mb-1">Interest in Law</label>
                            <textarea 
                                id="ps-legal"
                                bind:value={personalStatementData.personalDetails.legalInterest}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="What sparked your interest in law and justice?"
                            ></textarea>
                        </div>
                    {/if}
                    
                    <div>
                        <label for="ps-future" class="block text-sm font-medium text-gray-700 mb-1">Future Goals</label>
                        <textarea 
                            id="ps-future"
                            bind:value={personalStatementData.personalDetails.futureGoals}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="What are your aspirations and how will this opportunity help?"
                        ></textarea>
                        {#if existingSOPData}
                            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><Sparkles size={12} /> Pre-filled from your SOP. Feel free to edit.</p>
                        {/if}
                    </div>
                    
                    <div>
                        <label for="ps-why-program" class="block text-sm font-medium text-gray-700 mb-1">Why This Program/Institution?</label>
                        <textarea 
                            id="ps-why-program"
                            bind:value={personalStatementData.personalDetails.whyThisProgram}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="What specifically attracts you to this opportunity?"
                        ></textarea>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 4}
            <!-- Step 4: Review & Generate -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Review & Generate</h3>
                
                <!-- Summary -->
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-gray-900 mb-3">Summary</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium">Application Type:</span> 
                            <span class="capitalize">{personalStatementData.applicationType.replace('_', ' ')}</span>
                        </div>
                        <div>
                            <span class="font-medium">Institution:</span> 
                            {personalStatementData.institutionName || 'Not specified'}
                        </div>
                        <div>
                            <span class="font-medium">Program:</span> 
                            {personalStatementData.programName || 'Not specified'}
                        </div>
                        <div>
                            <span class="font-medium">Word Limit:</span> 
                            {personalStatementData.wordLimit ? personalStatementData.wordLimit + ' words' : 'Not specified'}
                        </div>
                    </div>
                </div>
                
                <!-- Custom Requests -->
                <div class="mb-6">
                    <label for="ps-custom-requests" class="block text-sm font-medium text-gray-700 mb-1">Additional Instructions (Optional)</label>
                    <textarea 
                        id="ps-custom-requests"
                        bind:value={personalStatementData.customRequests}
                        rows="3"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Any specific tone, style, or content requests for your personal statement..."
                    ></textarea>
                </div>
                
                <!-- AI Usage Disclaimer -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div class="flex items-start gap-3">
                        <AlertTriangle size={18} class="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div class="text-sm text-amber-800">
                            <div class="font-semibold mb-1">Important Disclaimer</div>
                            <p class="leading-relaxed">
                                This AI-generated personal statement should be used as a <strong>guide and starting point</strong> for your application. 
                                Please review, personalize, and adapt the content to reflect your unique voice and experiences. 
                                <strong>Do not submit AI-generated content directly without thorough review and modification.</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Generate Button -->
                <button
                    onclick={generatePersonalStatement}
                    disabled={!personalStatementData.institutionName || !personalStatementData.personalDetails.formativeExperience}
                    class="w-full bg-gradient-to-r from-[#2C3580] to-[#2C3580] text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} /> Generate Personal Statement
                </button>
            </div>
            
        {:else}
            <!-- Results -->
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Your Personal Statement</h3>
                    <div class="flex gap-2">
                        <button
                            onclick={copyPersonalStatement}
                            class="px-6 py-3 bg-[#2C3580] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <Clipboard size={16} /> Copy to Clipboard
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="prose max-w-none">
                        {#each generatedPersonalStatement.split('\n') as paragraph}
                            {#if paragraph.trim()}
                                <p class="mb-4">{paragraph}</p>
                            {/if}
                        {/each}
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button onclick={savePersonalStatement} class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                        <Save size={16} /> Save & Edit
                    </button>
                    <button onclick={startOver} class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <RefreshCw size={16} /> Create Another
                    </button>
                </div>
            </div>
        {/if}
        
        <!-- Navigation Buttons -->
        {#if currentStep <= totalSteps}
            <div class="flex justify-between items-center p-6 border-t border-gray-200">
                {#if currentStep > 1}
                    <button
                        onclick={prevStep}
                        class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ← Previous
                    </button>
                {:else}
                    <div></div>
                {/if}
                
                {#if currentStep < totalSteps}
                    <button
                        onclick={nextStep}
                        disabled={
                            (currentStep === 1 && !personalStatementData.applicationType) ||
                            (currentStep === 2 && (!personalStatementData.institutionName || !personalStatementData.programName)) ||
                            (currentStep === 3 && !personalStatementData.personalDetails.formativeExperience)
                        }
                        class="px-6 py-2 bg-[#2C3580] text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                {:else}
                    <div></div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .personal-statement-generator {
        max-width: 100%;
        margin: 0 auto;
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Enhanced selection styling */
    .border-3 {
        border-width: 3px;
    }
    
    label {
        transition: all 0.3s ease-in-out;
    }
</style>