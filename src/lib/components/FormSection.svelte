<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import LoginModal from './LoginModal.svelte';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import { browser } from '$app/environment';
    import { writable } from 'svelte/store';
    import type { Writable } from 'svelte/store';

    export let supabase: SupabaseClient;
    export let session: any;

    // --- Core State Variables ---
    let currentStep = 1;
    const totalSteps = 4;
    let steps = [
        { number: 1, label: 'University', active: true },
        { number: 2, label: 'Academics', active: false },
        { number: 3, label: 'Work Experience', active: false },
        { number: 4, label: 'Extra-Curricular', active: false }
    ];

    let errors: string[] = [];
    $: loggedIn = !!session;
    let showLoginModal = false;

    // --- Form Data Variables ---
    let universityData = {
        university: '',
        country: '',
        program: ''
    };

    const countries = [
        'United States of America', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Ireland', 'New Zealand', 'Singapore', 'Japan', '──────────',
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
        'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
        'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
        'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'Gabon', 'Gambia', 'Georgia', 'Ghana',
        'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
        'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Italy', 'Ivory Coast',
        'Jamaica', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
        'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
        'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
        'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
        'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Niger', 'Nigeria',
        'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama',
        'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
        'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
        'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
        'Seychelles', 'Sierra Leone', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
        'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
        'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
        'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
        'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu',
        'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
    ];

    let isCustomQuality = false;
    let customQualityReason = '';
    let selectedQualities: string[] = [];
    let selectedAspiration = '';
    let customAspiration = '';
    let isBestChoiceSelected = false;

    let academicData = {
        degreeType: '',
        fieldOfStudy: '',
        universityName: '',
        gpa: '', // GPA is now optional, not validated here
        relevantCourses: '',
    };
    let projects: { text: string }[] = [{ text: '' }];
    let achievements: { title: string; description: string }[] = [{ title: '', description: '' }];

    let showWorkExperienceForm = false;
    let workExperiences: { company: string; position: string; responsibilities: string[]; companyDescription: string; skills: string; projects: string }[] = [{ company: '', position: '', responsibilities: [''], companyDescription: '', skills: '', projects: '' }];

    let showOrganizationsForm = false;
    let organizations: { name: string; role: string; description: string }[] = [{ name: '', role: '', description: '' }];
    let showCommunityServiceForm = false;
    let communityServices: { organization: string; role: string; impact: string }[] = [{ organization: '', role: '', impact: '' }];
    let showHobbiesForm = false;
    let hobbies: string = '';
    let showAchievementsForm = false;

    // --- Utility Functions ---
    function updateActiveStep() {
        steps = steps.map(step => ({
            ...step,
            active: step.number === currentStep
        }));
    }

    function isValidEmail(email: string): boolean {
        // Basic email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validateStep(step: number): boolean {
        errors = []; // Clear errors at the beginning of validation

        if (step === 1) {
            // University Data
            if (!universityData.university.trim()) errors.push('University Name is required.');
            if (!universityData.country.trim()) errors.push('Country is required.');
            if (!universityData.program.trim()) errors.push('Program is required.');
        } else if (step === 2) {
            // Academics Data
            if (!academicData.degreeType.trim()) errors.push('Degree Type is required.');
            if (!academicData.fieldOfStudy.trim()) errors.push('Field of Study is required.');
            if (!academicData.universityName.trim()) errors.push('University Name is required.');
            // GPA is now optional.

            // Aspirations and Qualities
            if (!selectedAspiration.trim() && !customAspiration.trim()) {
                errors.push('Please select an aspiration or provide a custom one.');
            }
            if (isBestChoiceSelected && !customAspiration.trim()) {
                errors.push('Please provide your custom aspiration.');
            }
            if (!isCustomQuality && selectedQualities.length === 0) {
                errors.push('Please select at least one quality.');
            }
            if (isCustomQuality && !customQualityReason.trim()) {
                errors.push('Please provide a reason for your custom quality.');
            }
        } else if (step === 3) {
            // Work Experience
            if (showWorkExperienceForm) {
                workExperiences.forEach((exp, index) => {
                    if (!exp.company.trim()) errors.push(`Work Experience ${index + 1}: Company Name is required.`);
                    if (!exp.position.trim()) errors.push(`Work Experience ${index + 1}: Position is required.`);
                    if (exp.responsibilities.some(r => !r.trim())) errors.push(`Work Experience ${index + 1}: All responsibilities must be filled.`);
                });
            }
        } else if (step === 4) {
            // Extra-Curricular
            if (showOrganizationsForm) {
                organizations.forEach((org, index) => {
                    if (!org.name.trim()) errors.push(`Organization ${index + 1}: Name is required.`);
                    if (!org.role.trim()) errors.push(`Organization ${index + 1}: Role is required.`);
                    if (!org.description.trim()) errors.push(`Organization ${index + 1}: Description is required.`);
                });
            }
            if (showCommunityServiceForm) {
                communityServices.forEach((service, index) => {
                    if (!service.organization.trim()) errors.push(`Community Service ${index + 1}: Organization is required.`);
                    if (!service.role.trim()) errors.push(`Community Service ${index + 1}: Role is required.`);
                    if (!service.impact.trim()) errors.push(`Community Service ${index + 1}: Impact is required.`);
                });
            }
            // Projects and Achievements are NOT mandatory for step 4, the HTML `required` attributes are handled in template.
        }

        return errors.length === 0;
    }

    // --- Data Persistence (Session Storage) ---
    function saveDataToSessionStorage() {
        if (browser) {
            console.log('saveDataToSessionStorage: Saving data. Current step:', currentStep);
            sessionStorage.setItem('currentStep', String(currentStep));
            sessionStorage.setItem('universityData', JSON.stringify(universityData));
            sessionStorage.setItem('academicData', JSON.stringify(academicData));
            sessionStorage.setItem('projects', JSON.stringify(projects));
            sessionStorage.setItem('achievements', JSON.stringify(achievements));
            sessionStorage.setItem('selectedQualities', JSON.stringify(selectedQualities));
            sessionStorage.setItem('selectedAspiration', selectedAspiration);
            sessionStorage.setItem('customAspiration', customAspiration);
            sessionStorage.setItem('isBestChoiceSelected', String(isBestChoiceSelected));
            sessionStorage.setItem('isCustomQuality', String(isCustomQuality));
            sessionStorage.setItem('customQualityReason', customQualityReason);
            sessionStorage.setItem('showWorkExperienceForm', String(showWorkExperienceForm));
            sessionStorage.setItem('workExperiences', JSON.stringify(workExperiences));
            sessionStorage.setItem('showOrganizationsForm', String(showOrganizationsForm));
            sessionStorage.setItem('organizations', JSON.stringify(organizations));
            sessionStorage.setItem('showCommunityServiceForm', String(showCommunityServiceForm));
            sessionStorage.setItem('communityServices', JSON.stringify(communityServices));
            sessionStorage.setItem('showHobbiesForm', String(showHobbiesForm));
            sessionStorage.setItem('hobbies', hobbies);
            sessionStorage.setItem('showAchievementsForm', String(showAchievementsForm));
        }
    }

    function loadDataFromSessionStorage() {
        if (browser) {
            console.log('loadDataFromSessionStorage: Attempting to load data from sessionStorage');
            const savedCurrentStep = sessionStorage.getItem('currentStep');
            if (savedCurrentStep) {
                currentStep = parseInt(savedCurrentStep);
                updateActiveStep();
                console.log('loadDataFromSessionStorage: Loaded currentStep:', currentStep);
            }

            const savedUniversityData = sessionStorage.getItem('universityData');
            if (savedUniversityData) {
                universityData = JSON.parse(savedUniversityData);
                console.log('loadDataFromSessionStorage: Loaded universityData:', universityData);
            }

            const savedAcademicData = sessionStorage.getItem('academicData');
            if (savedAcademicData) {
                academicData = JSON.parse(savedAcademicData);
                console.log('loadDataFromSessionStorage: Loaded academicData:', academicData);
            }

            const savedProjects = sessionStorage.getItem('projects');
            if (savedProjects) projects = JSON.parse(savedProjects);

            const savedAchievements = sessionStorage.getItem('achievements');
            if (savedAchievements) achievements = JSON.parse(savedAchievements);

            const savedSelectedQualities = sessionStorage.getItem('selectedQualities');
            if (savedSelectedQualities) selectedQualities = JSON.parse(savedSelectedQualities);

            const savedSelectedAspiration = sessionStorage.getItem('selectedAspiration');
            if (savedSelectedAspiration) selectedAspiration = savedSelectedAspiration;

            const savedCustomAspiration = sessionStorage.getItem('customAspiration');
            if (savedCustomAspiration) customAspiration = savedCustomAspiration;

            const savedIsBestChoiceSelected = sessionStorage.getItem('isBestChoiceSelected');
            if (savedIsBestChoiceSelected !== null) isBestChoiceSelected = savedIsBestChoiceSelected === 'true';

            const savedIsCustomQuality = sessionStorage.getItem('isCustomQuality');
            if (savedIsCustomQuality !== null) isCustomQuality = savedIsCustomQuality === 'true';

            const savedCustomQualityReason = sessionStorage.getItem('customQualityReason');
            if (savedCustomQualityReason) customQualityReason = savedCustomQualityReason;

            const savedShowWorkExperienceForm = sessionStorage.getItem('showWorkExperienceForm');
            if (savedShowWorkExperienceForm !== null) showWorkExperienceForm = savedShowWorkExperienceForm === 'true';

            const savedWorkExperiences = sessionStorage.getItem('workExperiences');
            if (savedWorkExperiences) workExperiences = JSON.parse(savedWorkExperiences);

            const savedShowOrganizationsForm = sessionStorage.getItem('showOrganizationsForm');
            if (savedShowOrganizationsForm !== null) showOrganizationsForm = savedShowOrganizationsForm === 'true';

            const savedOrganizations = sessionStorage.getItem('organizations');
            if (savedOrganizations) organizations = JSON.parse(savedOrganizations);

            const savedShowCommunityServiceForm = sessionStorage.getItem('showCommunityServiceForm');
            if (savedShowCommunityServiceForm !== null) showCommunityServiceForm = savedShowCommunityServiceForm === 'true';

            const savedCommunityServices = sessionStorage.getItem('communityServices');
            if (savedCommunityServices) communityServices = JSON.parse(savedCommunityServices);

            const savedShowHobbiesForm = sessionStorage.getItem('showHobbiesForm');
            if (savedShowHobbiesForm !== null) showHobbiesForm = savedShowHobbiesForm === 'true';

            const savedHobbies = sessionStorage.getItem('hobbies');
            if (savedHobbies) hobbies = savedHobbies;

            const savedShowAchievementsForm = sessionStorage.getItem('showAchievementsForm');
            if (savedShowAchievementsForm !== null) showAchievementsForm = savedShowAchievementsForm === 'true';

            console.log('loadDataFromSessionStorage: Data loading complete.');
        }
    }

    // --- Navigation and Form Control ---
    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateActiveStep();
                saveDataToSessionStorage(); // Save data on navigation
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            currentStep--;
            updateActiveStep();
            saveDataToSessionStorage(); // Save data on navigation
        }
    };

    const handleLoginSuccess = async () => {
        // This function simply closes the modal and relies on onAuthStateChange
        // to handle the post-login SOP generation and redirection.
        console.log('handleLoginSuccess (from LoginModal): Called. Closing modal.');
        showLoginModal = false;
    };

    const handleLoginModalClose = () => {
        console.log('handleLoginModalClose: Called. Closing modal.');
        showLoginModal = false;
    };

    const handleSubmit = async () => {
        console.log('handleSubmit: Called. currentStep:', currentStep, 'loggedIn:', loggedIn);
        if (!validateStep(currentStep)) {
            console.error('handleSubmit: Validation failed. Errors:', errors);
            alert('Please correct the errors before generating SOP.');
            return;
        }

        // Only show login modal if not logged in and on the last step (Generate SOP)
        if (!loggedIn && currentStep === totalSteps) {
            showLoginModal = true;
            console.log('handleSubmit: Showing login modal as not logged in on last step.');
            return; // Wait for login to complete before proceeding
        }

        if (currentStep === totalSteps && loggedIn) {
            console.log('handleSubmit: Logged in on last step. Proceeding with SOP generation...');
            // Ensure latest data is loaded and saved before submission
            loadDataFromSessionStorage();
            saveDataToSessionStorage();

            const formData = {
                universityData,
                academicData: {
                    ...academicData,
                    selectedQualities: selectedQualities,
                    selectedAspiration: selectedAspiration,
                    customAspiration: customAspiration, // Corrected typo here, double check if your previous version had this typo.
                    isCustomQuality: isCustomQuality,
                    customQualityReason: customQualityReason,
                    isBestChoiceSelected: isBestChoiceSelected
                },
                workExperience: {
                    showWorkExperienceForm,
                    workExperiences: workExperiences.filter(exp => exp.company.trim() || exp.position.trim() || exp.responsibilities.some(r => r.trim()))
                },
                extraCurricular: {
                    showOrganizationsForm,
                    organizations: organizations.filter(org => org.name.trim() || org.role.trim() || org.description.trim()),
                    showCommunityServiceForm,
                    communityServices: communityServices.filter(service => service.organization.trim() || service.role.trim() || service.impact.trim()),
                    showHobbiesForm,
                    hobbies: hobbies.trim(),
                    showAchievementsForm,
                    projects: projects.filter(p => p.text.trim()),
                    achievements: achievements.filter(a => a.title.trim() || a.description.trim())
                }
            };

            console.log('handleSubmit: Sending formData:', formData);

            try {
                const response = await fetch('/api/generate-sop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('handleSubmit: OpenAI API error response:', errorData); // Log full error
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${(errorData as any).error || 'Unknown error'}`);
                }

                const result = await response.json();
                console.log('handleSubmit: SOP generated successfully:', result);

                // This alert will be replaced later with a custom pop-up
                alert('Your SOP has been successfully generated!');

                // Redirect to dashboard with generated SOP
                sessionStorage.clear(); // Clear session storage after successful SOP generation and redirection
                goto(`/dashboard?sop=${encodeURIComponent(result.generatedSOP)}`);
            } catch (error: any) {
                console.error('handleSubmit: Failed to generate SOP:', error);
                alert(`Failed to generate SOP: ${error.message}`);
            }
        }
    };

    onMount(() => {
        console.log('onMount: FormSection mounted. Initial session:', session, 'loggedIn:', loggedIn, 'currentStep:', currentStep);

        // Always attempt to load data from sessionStorage on mount
        loadDataFromSessionStorage();
        console.log('onMount: currentStep after initial loadDataFromSessionStorage:', currentStep);

        // Handle OAuth redirect scenario
        if (browser && window.location.hash.includes('access_token')) {
            console.log('onMount: OAuth access token detected in URL hash. Cleaning URL and ensuring data load for auto-submission.');
            history.replaceState({}, '', '/'); // Clean the URL hash immediately

            // After cleaning the URL, ensure data is re-loaded to get the most accurate state
            // and rely on onAuthStateChange to trigger handleSubmit for first-time login auto-submission.
            loadDataFromSessionStorage(); // Ensure data is current after redirect
            console.log('onMount: currentStep after OAuth redirect and re-load:', currentStep);
        }

        // Listen for auth state changes to handle post-login logic
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('onAuthStateChange: Event:', event, 'currentSession:', currentSession, 'old session:', session);
                
                if (currentSession && !session) { // User just logged in
                    session = currentSession; // Update local session state
                    console.log('onAuthStateChange: User just logged in (SIGNED_IN event expected).');

                    // Crucial: Ensure latest data (especially currentStep) is loaded from sessionStorage
                    // BEFORE deciding whether to call handleSubmit.
                    loadDataFromSessionStorage();
                    console.log('onAuthStateChange: After loadDataFromSessionStorage, currentStep is:', currentStep);

                    if (event === 'SIGNED_IN' && currentStep === totalSteps) {
                        console.log('onAuthStateChange: SIGNED_IN event on last step. Triggering handleSubmit.');
                        await handleSubmit();
                    } else if (event === 'SIGNED_IN') {
                        console.log('onAuthStateChange: SIGNED_IN event, but not on last step. Ensuring data loaded.');
                        // If signed in but not on last step (e.g., direct visit after login, or session refresh not from form submit),
                        // just ensure data is loaded. No auto-submit needed here.
                        loadDataFromSessionStorage(); 
                    }
                } else if (!currentSession && session) { // User just logged out
                    console.log('onAuthStateChange: User logged out (SIGNED_OUT event expected).');
                    session = null; // Clear local session state
                    // Optionally clear session storage here if you want a completely fresh start on logout.
                    // sessionStorage.clear();
                } else {
                    console.log('onAuthStateChange: Other auth event or session refresh. currentStep:', currentStep);
                    // For any other auth event (e.g., TOKEN_REFRESHED), ensure data is loaded
                    loadDataFromSessionStorage();
                }
            }
        );

        // Clean up the auth listener on component unmount
        onDestroy(() => {
            console.log('onDestroy: Cleaning up auth listener.');
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
        });

        // Ensure data is saved when navigating away from the page (handles browser close/tab close)
        const handleBeforeUnload = () => {
            console.log('handleBeforeUnload: Saving data before unload.');
            saveDataToSessionStorage();
        };
        if (browser) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        onDestroy(() => {
            if (browser) {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        });
    });

    // Reactive statement to save data whenever currentStep, form data, or toggle states change
    $: {
        console.log('Reactive statement: Data changed, saving to sessionStorage. currentStep:', currentStep);
        saveDataToSessionStorage();
    }
</script>


<!-- Main Form Structure -->
<div class="p-4 sm:p-6 md:p-8 lg:p-10 bg-white shadow-lg rounded-lg max-w-4xl mx-auto my-8">
    <div class="mb-6">
        <ul class="flex justify-between items-center text-sm font-medium text-center text-gray-500">
            {#each steps as step (step.number)}
                <li class="relative flex-1">
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 flex items-center justify-center rounded-full border-2 {step.active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-500'} transition-colors duration-200">
                            {step.number}
                        </div>
                        <span class="mt-2 text-xs {step.active ? 'text-indigo-600' : 'text-gray-500'}">{step.label}</span>
                    </div>
                    {#if step.number < totalSteps}
                        <div class="absolute top-4 left-1/2 -translate-x-1/2 w-full h-0.5 bg-gray-200 z-[-1] transition-colors duration-200"></div>
                    {/if}
                </li>
            {/each}
        </ul>
    </div>

    <!-- Error Display -->
    {#if errors.length > 0}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong class="font-bold">Errors:</strong>
            <ul class="mt-1 list-disc list-inside">
                {#each errors as error}
                    <li>{error}</li>
                {/each}
            </ul>
        </div>
    {/if}

    <!-- Step 1: University Data -->
    {#if currentStep === 1}
        <h2 class="text-2xl font-bold mb-6 text-gray-800">University Application Details</h2>
        <form on:submit|preventDefault={handleNext}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="university-name" class="block text-sm font-medium text-gray-700 mb-2">University Name <span class="text-red-500">*</span></label>
                    <input type="text" id="university-name" bind:value={universityData.university} placeholder="e.g., Harvard University" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                </div>
                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country Applying To <span class="text-red-500">*</span></label>
                    <select id="country" bind:value={universityData.country} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true">
                        <option value="" disabled selected>Select a country</option>
                        {#each countries as country}
                            <option value={country}>{country}</option>
                        {/each}
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label for="program" class="block text-sm font-medium text-gray-700 mb-2">Program/Course Applying For <span class="text-red-500">*</span></label>
                    <input type="text" id="program" bind:value={universityData.program} placeholder="e.g., Master of Computer Science" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                </div>
            </div>
            <div class="flex justify-end mt-8">
                <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Next
                </button>
            </div>
        </form>
    {/if}

    <!-- Step 2: Academic Data -->
    {#if currentStep === 2}
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Academic Background</h2>
        <form on:submit|preventDefault={handleNext}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label for="degree-type" class="block text-sm font-medium text-gray-700 mb-2">Degree Type <span class="text-red-500">*</span></label>
                    <input type="text" id="degree-type" bind:value={academicData.degreeType} placeholder="e.g., Bachelor of Technology" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                </div>
                <div>
                    <label for="field-of-study" class="block text-sm font-medium text-gray-700 mb-2">Field of Study <span class="text-red-500">*</span></label>
                    <input type="text" id="field-of-study" bind:value={academicData.fieldOfStudy} placeholder="e.g., Computer Engineering" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                </div>
                <div class="md:col-span-2">
                    <label for="academic-university-name" class="block text-sm font-medium text-gray-700 mb-2">University Name <span class="text-red-500">*</span></label>
                    <input type="text" id="academic-university-name" bind:value={academicData.universityName} placeholder="e.g., Delhi Technological University" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                </div>
                <div>
                    <label for="gpa" class="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
                    <input type="text" id="gpa" bind:value={academicData.gpa} placeholder="e.g., 3.8/4.0 or 85%" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                </div>
                <div class="md:col-span-2">
                    <label for="relevant-courses" class="block text-sm font-medium text-gray-700 mb-2">Relevant Courses (Optional)</label>
                    <textarea id="relevant-courses" bind:value={academicData.relevantCourses} rows="3" placeholder="e.g., Data Structures, Algorithms, Machine Learning" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
            </div>

            <h3 class="text-xl font-bold mb-4 text-gray-800">Your Aspirations</h3>
            <fieldset class="mb-6">
                <legend class="block text-sm font-medium text-gray-700 mb-2">What is your primary aspiration for pursuing this program? <span class="text-red-500">*</span></legend>
                <div class="flex flex-wrap gap-4">
                    <label for="aspiration-career" class="inline-flex items-center">
                        <input type="radio" name="aspiration" value="Career Advancement" bind:group={selectedAspiration} class="form-radio text-indigo-600 h-4 w-4" id="aspiration-career"/>
                        <span class="ml-2 text-gray-700">Career Advancement</span>
                    </label>
                    <label for="aspiration-research" class="inline-flex items-center">
                        <input type="radio" name="aspiration" value="Academic Research" bind:group={selectedAspiration} class="form-radio text-indigo-600 h-4 w-4" id="aspiration-research"/>
                        <span class="ml-2 text-gray-700">Academic Research</span>
                    </label>
                    <label for="aspiration-change" class="inline-flex items-center">
                        <input type="radio" name="aspiration" value="Change of Career" bind:group={selectedAspiration} class="form-radio text-indigo-600 h-4 w-4" id="aspiration-change"/>
                        <span class="ml-2 text-gray-700">Change of Career</span>
                    </label>
                    <label for="aspiration-personal" class="inline-flex items-center">
                        <input type="radio" name="aspiration" value="Personal Growth" bind:group={selectedAspiration} class="form-radio text-indigo-600 h-4 w-4" id="aspiration-personal"/>
                        <span class="ml-2 text-gray-700">Personal Growth</span>
                    </label>
                    <label for="aspiration-best" class="inline-flex items-center">
                        <input type="radio" name="aspiration" value="Best Choice" bind:group={selectedAspiration} class="form-radio text-indigo-600 h-4 w-4" id="aspiration-best"/>
                        <span class="ml-2 text-gray-700">My Best Choice</span>
                    </label>
                </div>
                {#if selectedAspiration === 'Best Choice'}
                    <div class="mt-4">
                        <label for="custom-aspiration" class="block text-sm font-medium text-gray-700 mb-2">Please describe your custom aspiration: <span class="text-red-500">*</span></label>
                        <textarea id="custom-aspiration" bind:value={customAspiration} rows="2" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"></textarea>
                    </div>
                {/if}
            </fieldset>

            <h3 class="text-xl font-bold mb-4 text-gray-800">Your Qualities</h3>
            <fieldset class="mb-6">
                <legend class="block text-sm font-medium text-gray-700 mb-2">Which qualities describe you best? (Select all that apply) <span class="text-red-500">*</span></legend>
                <div class="flex flex-wrap gap-4">
                    <label for="quality-innovative" class="inline-flex items-center">
                        <input type="checkbox" value="Innovative" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-innovative"/>
                        <span class="ml-2 text-gray-700">Innovative</span>
                    </label>
                    <label for="quality-resilient" class="inline-flex items-center">
                        <input type="checkbox" value="Resilient" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-resilient"/>
                        <span class="ml-2 text-gray-700">Resilient</span>
                    </label>
                    <label for="quality-leader" class="inline-flex items-center">
                        <input type="checkbox" value="Leader" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-leader"/>
                        <span class="ml-2 text-gray-700">Leader</span>
                    </label>
                    <label for="quality-collaborative" class="inline-flex items-center">
                        <input type="checkbox" value="Collaborative" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-collaborative"/>
                        <span class="ml-2 text-gray-700">Collaborative</span>
                    </label>
                    <label for="quality-determined" class="inline-flex items-center">
                        <input type="checkbox" value="Determined" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-determined"/>
                        <span class="ml-2 text-gray-700">Determined</span>
                    </label>
                    <label for="quality-problem-solver" class="inline-flex items-center">
                        <input type="checkbox" value="Problem-Solver" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-problem-solver"/>
                        <span class="ml-2 text-gray-700">Problem-Solver</span>
                    </label>
                    <label for="quality-critical-thinker" class="inline-flex items-center">
                        <input type="checkbox" value="Critical Thinker" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-critical-thinker"/>
                        <span class="ml-2 text-gray-700">Critical Thinker</span>
                    </label>
                    <label for="quality-adaptable" class="inline-flex items-center">
                        <input type="checkbox" value="Adaptable" bind:group={selectedQualities} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-adaptable"/>
                        <span class="ml-2 text-gray-700">Adaptable</span>
                    </label>
                    <label for="quality-custom" class="inline-flex items-center">
                        <input type="checkbox" value="Custom" bind:group={isCustomQuality} class="form-checkbox text-indigo-600 h-4 w-4" id="quality-custom"/>
                        <span class="ml-2 text-gray-700">Custom</span>
                    </label>
                </div>
                {#if isCustomQuality}
                    <div class="mt-4">
                        <label for="custom-quality-reason" class="block text-sm font-medium text-gray-700 mb-2">Please describe your custom quality: <span class="text-red-500">*</span></label>
                        <textarea id="custom-quality-reason" bind:value={customQualityReason} rows="2" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"></textarea>
                    </div>
                {/if}
            </fieldset>

            <div class="flex justify-between mt-8">
                <button type="button" on:click={handleBack} class="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Back
                </button>
                <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Next
                </button>
            </div>
        </form>
    {/if}

    <!-- Step 3: Work Experience -->
    {#if currentStep === 3}
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Work Experience</h2>
        <form on:submit|preventDefault={handleNext}>
            <div class="mb-6">
                <label for="show-work-experience" class="inline-flex items-center">
                    <input type="checkbox" bind:checked={showWorkExperienceForm} class="form-checkbox text-indigo-600 h-5 w-5" id="show-work-experience"/>
                    <span class="ml-2 text-lg font-medium text-gray-700">I have work experience</span>
                </label>
            </div>

            {#if showWorkExperienceForm}
                {#each workExperiences as experience, i}
                    <div class="border p-4 rounded-md mb-4 {i > 0 ? 'mt-4' : ''}">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Work Experience {i + 1}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label for="company-name-{i}" class="block text-sm font-medium text-gray-700 mb-2">Company Name <span class="text-red-500">*</span></label>
                                <input type="text" id="company-name-{i}" bind:value={experience.company} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div>
                                <label for="position-{i}" class="block text-sm font-medium text-gray-700 mb-2">Position <span class="text-red-500">*</span></label>
                                <input type="text" id="position-{i}" bind:value={experience.position} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div class="md:col-span-2">
                                <label for="company-description-{i}" class="block text-sm font-medium text-gray-700 mb-2">Company Description (Optional)</label>
                                <textarea id="company-description-{i}" bind:value={experience.companyDescription} rows="2" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div class="md:col-span-2">
                                <!-- Changed from <label> to <div> for semantic correctness when not directly labeling an input -->
                                <div class="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities <span class="text-red-500">*</span></div>
                                {#each experience.responsibilities as resp, j}
                                    <div class="flex items-center mb-2">
                                        <label for="responsibility-{i}-{j}" class="sr-only">Responsibility {j + 1}</label> <!-- Visually hidden label -->
                                        <input type="text" id="responsibility-{i}-{j}" bind:value={experience.responsibilities[j]} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., Developed and maintained..." required aria-required="true"/>
                                        {#if experience.responsibilities.length > 1}
                                            <button type="button" on:click={() => {experience.responsibilities = experience.responsibilities.filter((_, k) => k !== j);}} class="ml-2 text-red-600 hover:text-red-800" aria-label="Remove responsibility">
                                                &times;
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                                <button type="button" on:click={() => experience.responsibilities = [...experience.responsibilities, '']} class="text-indigo-600 hover:text-indigo-800 text-sm mt-1">
                                    + Add Responsibility
                                </button>
                            </div>
                            <div class="md:col-span-2">
                                <label for="skills-{i}" class="block text-sm font-medium text-gray-700 mb-2">Skills Utilized (Optional)</label>
                                <textarea id="skills-{i}" bind:value={experience.skills} rows="2" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., Python, SQL, Machine Learning"></textarea>
                            </div>
                            <div class="md:col-span-2">
                                <label for="projects-{i}" class="block text-sm font-medium text-gray-700 mb-2">Projects (Optional)</label>
                                <textarea id="projects-{i}" bind:value={experience.projects} rows="2" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Briefly describe key projects"></textarea>
                            </div>
                        </div>
                        {#if workExperiences.length > 1}
                            <button type="button" on:click={() => workExperiences = workExperiences.filter((_, k) => k !== i)} class="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove this work experience">
                                Remove Work Experience
                            </button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={() => workExperiences = [...workExperiences, { company: '', position: '', responsibilities: [''], companyDescription: '', skills: '', projects: '' }]} class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    + Add Another Work Experience
                </button>
            {/if}

            <div class="flex justify-between mt-8">
                <button type="button" on:click={handleBack} class="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Back
                </button>
                <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Next
                </button>
            </div>
        </form>
    {/if}

    <!-- Step 4: Extra-Curricular Activities -->
    {#if currentStep === 4}
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Extra-Curricular & Projects</h2>
        <form on:submit|preventDefault={handleSubmit}>
            <!-- Organizations Section -->
            <div class="mb-6">
                <label for="show-organizations" class="inline-flex items-center">
                    <input type="checkbox" bind:checked={showOrganizationsForm} class="form-checkbox text-indigo-600 h-5 w-5" id="show-organizations"/>
                    <span class="ml-2 text-lg font-medium text-gray-700">I have leadership/organizational experience</span>
                </label>
            </div>
            {#if showOrganizationsForm}
                {#each organizations as org, i}
                    <div class="border p-4 rounded-md mb-4 {i > 0 ? 'mt-4' : ''}">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Organization {i + 1}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label for="org-name-{i}" class="block text-sm font-medium text-gray-700 mb-2">Organization Name <span class="text-red-500">*</span></label>
                                <input type="text" id="org-name-{i}" bind:value={org.name} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div>
                                <label for="org-role-{i}" class="block text-sm font-medium text-gray-700 mb-2">Your Role <span class="text-red-500">*</span></label>
                                <input type="text" id="org-role-{i}" bind:value={org.role} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div class="md:col-span-2">
                                <label for="org-description-{i}" class="block text-sm font-medium text-gray-700 mb-2">Description of your contribution <span class="text-red-500">*</span></label>
                                <textarea id="org-description-{i}" bind:value={org.description} rows="3" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"></textarea>
                            </div>
                        </div>
                        {#if organizations.length > 1}
                            <button type="button" on:click={() => organizations = organizations.filter((_, k) => k !== i)} class="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove this organization">
                                Remove Organization
                            </button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={() => organizations = [...organizations, { name: '', role: '', description: '' }]} class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    + Add Another Organization
                </button>
            {/if}

            <!-- Community Service Section -->
            <div class="mt-8 mb-6">
                <label for="show-community-service" class="inline-flex items-center">
                    <input type="checkbox" bind:checked={showCommunityServiceForm} class="form-checkbox text-indigo-600 h-5 w-5" id="show-community-service"/>
                    <span class="ml-2 text-lg font-medium text-gray-700">I have community service experience</span>
                </label>
            </div>
            {#if showCommunityServiceForm}
                {#each communityServices as service, i}
                    <div class="border p-4 rounded-md mb-4 {i > 0 ? 'mt-4' : ''}">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Community Service {i + 1}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label for="cs-organization-{i}" class="block text-sm font-medium text-gray-700 mb-2">Organization <span class="text-red-500">*</span></label>
                                <input type="text" id="cs-organization-{i}" bind:value={service.organization} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div>
                                <label for="cs-role-{i}" class="block text-sm font-medium text-gray-700 mb-2">Your Role <span class="text-red-500">*</span></label>
                                <input type="text" id="cs-role-{i}" bind:value={service.role} class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"/>
                            </div>
                            <div class="md:col-span-2">
                                <label for="cs-impact-{i}" class="block text-sm font-medium text-gray-700 mb-2">Describe your impact <span class="text-red-500">*</span></label>
                                <textarea id="cs-impact-{i}" bind:value={service.impact} rows="3" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required aria-required="true"></textarea>
                            </div>
                        </div>
                        {#if communityServices.length > 1}
                            <button type="button" on:click={() => communityServices = communityServices.filter((_, k) => k !== i)} class="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove this community service">
                                Remove Community Service
                            </button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={() => communityServices = [...communityServices, { organization: '', role: '', impact: '' }]} class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    + Add Another Community Service
                </button>
            {/if}

            <!-- Projects Section (Optional) -->
            <div class="mt-8 mb-6">
                <label for="show-achievements" class="inline-flex items-center">
                    <input type="checkbox" bind:checked={showAchievementsForm} class="form-checkbox text-indigo-600 h-5 w-5" id="show-achievements"/>
                    <span class="ml-2 text-lg font-medium text-gray-700">I have significant projects or achievements</span>
                </label>
            </div>
            {#if showAchievementsForm}
                <h3 class="text-xl font-bold mb-4 text-gray-800">Projects (Optional)</h3>
                {#each projects as project, i}
                    <div class="border p-4 rounded-md mb-4 {i > 0 ? 'mt-4' : ''}">
                        <label for="project-text-{i}" class="block text-sm font-medium text-gray-700 mb-2">Project/Research/Publication (Optional)</label>
                        <textarea id="project-text-{i}" bind:value={project.text} rows="3" placeholder="Describe a significant project, research, or publication." class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                        {#if projects.length > 1}
                            <button type="button" on:click={() => projects = projects.filter((_, k) => k !== i)} class="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove this project">
                                Remove Project
                            </button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={() => projects = [...projects, { text: '' }]} class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    + Add Another Project
                </button>

                <h3 class="text-xl font-bold mt-8 mb-4 text-gray-800">Achievements (Optional)</h3>
                {#each achievements as achievement, i}
                    <div class="border p-4 rounded-md mb-4 {i > 0 ? 'mt-4' : ''}">
                        <div>
                            <label for="achievement-title-{i}" class="block text-sm font-medium text-gray-700 mb-2">Achievement Title (Optional)</label>
                            <input type="text" id="achievement-title-{i}" bind:value={achievement.title} placeholder="e.g., Dean's List, Scholarship Recipient" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div class="mt-4">
                            <label for="achievement-description-{i}" class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                            <textarea id="achievement-description-{i}" bind:value={achievement.description} rows="3" class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                        </div>
                        {#if achievements.length > 1}
                            <button type="button" on:click={() => achievements = achievements.filter((_, k) => k !== i)} class="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove this achievement">
                                Remove Achievement
                            </button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={() => achievements = [...achievements, { title: '', description: '' }]} class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    + Add Another Achievement
                </button>
            {/if}

            <!-- Hobbies Section (Optional) -->
            <div class="mt-8 mb-6">
                <label for="show-hobbies" class="inline-flex items-center">
                    <input type="checkbox" bind:checked={showHobbiesForm} class="form-checkbox text-indigo-600 h-5 w-5" id="show-hobbies"/>
                    <span class="ml-2 text-lg font-medium text-gray-700">I want to include hobbies/interests</span>
                </label>
            </div>
            {#if showHobbiesForm}
                <div class="mb-6">
                    <label for="hobbies" class="block text-sm font-medium text-gray-700 mb-2">Hobbies & Interests (Optional)</label>
                    <textarea id="hobbies" bind:value={hobbies} rows="3" placeholder="e.g., Photography, hiking, coding personal projects, playing guitar." class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
            {/if}

            <div class="flex justify-between mt-8">
                <button type="button" on:click={handleBack} class="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Back
                </button>
                <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Generate SOP
                </button>
            </div>
        </form>
    {/if}
</div>

{#if showLoginModal}
    <LoginModal
        show={showLoginModal}
        supabase={supabase}
        on:loginSuccess={handleLoginSuccess}
        on:close={handleLoginModalClose}
    />
{/if}