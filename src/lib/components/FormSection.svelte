<script lang="ts">
    import { onMount } from 'svelte';

    let currentStep = 1;
    const totalSteps = 4;
    let steps = [
        { number: 1, label: 'University', active: true },
        { number: 2, label: 'Academics', active: false },
        { number: 3, label: 'Work Experience', active: false },
        { number: 4, label: 'Extra-Curricular', active: false }
    ];

    let hasUnfinishedProgress = false;
    let lastUpdated: string | null = null;

    // Function to safely check if localStorage is available
    function isLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Popular study destinations first, followed by all other countries
    const countries = [
        // Popular Destinations
        'United States of America',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Netherlands',
        'Ireland',
        'New Zealand',
        'Singapore',
        'Japan',
        '──────────',
        // All other countries alphabetically
        'Afghanistan',
        'Albania',
        'Algeria',
        'Andorra',
        'Angola',
        'Antigua and Barbuda',
        'Argentina',
        'Armenia',
        'Austria',
        'Azerbaijan',
        'Bahamas',
        'Bahrain',
        'Bangladesh',
        'Barbados',
        'Belarus',
        'Belgium',
        'Belize',
        'Benin',
        'Bhutan',
        'Bolivia',
        'Bosnia and Herzegovina',
        'Botswana',
        'Brazil',
        'Brunei',
        'Bulgaria',
        'Burkina Faso',
        'Burundi',
        'Cambodia',
        'Cameroon',
        'Cape Verde',
        'Central African Republic',
        'Chad',
        'Chile',
        'China',
        'Colombia',
        'Comoros',
        'Congo',
        'Costa Rica',
        'Croatia',
        'Cuba',
        'Cyprus',
        'Czech Republic',
        'Denmark',
        'Djibouti',
        'Dominica',
        'Dominican Republic',
        'Ecuador',
        'Egypt',
        'El Salvador',
        'Equatorial Guinea',
        'Eritrea',
        'Estonia',
        'Ethiopia',
        'Fiji',
        'Finland',
        'Gabon',
        'Gambia',
        'Georgia',
        'Ghana',
        'Greece',
        'Grenada',
        'Guatemala',
        'Guinea',
        'Guinea-Bissau',
        'Guyana',
        'Haiti',
        'Honduras',
        'Hungary',
        'Iceland',
        'India',
        'Indonesia',
        'Iran',
        'Iraq',
        'Israel',
        'Italy',
        'Ivory Coast',
        'Jamaica',
        'Jordan',
        'Kazakhstan',
        'Kenya',
        'Kiribati',
        'Kuwait',
        'Kyrgyzstan',
        'Laos',
        'Latvia',
        'Lebanon',
        'Lesotho',
        'Liberia',
        'Libya',
        'Liechtenstein',
        'Lithuania',
        'Luxembourg',
        'Madagascar',
        'Malawi',
        'Malaysia',
        'Maldives',
        'Mali',
        'Malta',
        'Marshall Islands',
        'Mauritania',
        'Mauritius',
        'Mexico',
        'Micronesia',
        'Moldova',
        'Monaco',
        'Mongolia',
        'Montenegro',
        'Morocco',
        'Mozambique',
        'Myanmar',
        'Namibia',
        'Nauru',
        'Nepal',
        'Nicaragua',
        'Niger',
        'Nigeria',
        'North Korea',
        'North Macedonia',
        'Norway',
        'Oman',
        'Pakistan',
        'Palau',
        'Panama',
        'Papua New Guinea',
        'Paraguay',
        'Peru',
        'Philippines',
        'Poland',
        'Portugal',
        'Qatar',
        'Romania',
        'Russia',
        'Rwanda',
        'Saint Kitts and Nevis',
        'Saint Lucia',
        'Saint Vincent and the Grenadines',
        'Samoa',
        'San Marino',
        'Sao Tome and Principe',
        'Saudi Arabia',
        'Senegal',
        'Serbia',
        'Seychelles',
        'Sierra Leone',
        'Slovakia',
        'Slovenia',
        'Solomon Islands',
        'Somalia',
        'South Africa',
        'South Korea',
        'South Sudan',
        'Spain',
        'Sri Lanka',
        'Sudan',
        'Suriname',
        'Sweden',
        'Switzerland',
        'Syria',
        'Taiwan',
        'Tajikistan',
        'Tanzania',
        'Thailand',
        'Timor-Leste',
        'Togo',
        'Tonga',
        'Trinidad and Tobago',
        'Tunisia',
        'Turkey',
        'Turkmenistan',
        'Tuvalu',
        'Uganda',
        'Ukraine',
        'United Arab Emirates',
        'Uruguay',
        'Uzbekistan',
        'Vanuatu',
        'Vatican City',
        'Venezuela',
        'Vietnam',
        'Yemen',
        'Zambia',
        'Zimbabwe'
    ];

    // For qualities section
    let isCustomQuality = false;
    let customQualityReason = '';
    let selectedQualities: string[] = [];

    function handleQualityChange(event: Event) {
        const target = event.target as HTMLInputElement;
        isCustomQuality = target.checked;
        if (!isCustomQuality) {
            customQualityReason = '';
            selectedQualities = [];
        }
    }

    $: showQualityTextbox = isCustomQuality;
    $: showOtherQualities = !isCustomQuality;

    let selectedAspiration = '';
    let customAspiration = '';
    let isBestChoiceSelected = false;

    $: showAspirationTextbox = isBestChoiceSelected;
    $: showOtherOptions = !isBestChoiceSelected;

    function handleBestChoiceChange(event: Event) {
        const target = event.target as HTMLInputElement;
        isBestChoiceSelected = target.checked;
        if (!isBestChoiceSelected) {
            customAspiration = '';
        }
        selectedAspiration = isBestChoiceSelected ? 'custom' : '';
    }

    // Form data
    let universityData = {
        university: '',
        country: '',
        program: '',
        name: '',
        email: ''
    };

    let academicsData = {
        highestDegree: '',
        fieldOfStudy: '',
        university: '',
        gpa: '',
        relevantCourses: ''
    };

    // For projects and achievements management
    let projects: { text: string }[] = [{ text: '' }];
    let achievements = [{
        title: '',
        description: ''
    }];

    function addProject() {
        projects = [...projects, { text: '' }];
    }

    function removeProject(index: number) {
        projects = projects.filter((_, i) => i !== index);
    }

    // Work experience data structure
    let workExperiences = [{
        company: '',
        companyDescription: '',
        position: '',
        skills: '',
        projects: '',
        responsibilities: ['']
    }];

    let showWorkExperienceForm = false;

    function handleWorkExperience() {
        showWorkExperienceForm = true;
    }

    function cancelWorkExperience() {
        showWorkExperienceForm = false;
        workExperiences = [{
            company: '',
            companyDescription: '',
            position: '',
            skills: '',
            projects: '',
            responsibilities: ['']
        }];
    }

    function addNewWorkExperience() {
        workExperiences = [...workExperiences, {
            company: '',
            companyDescription: '',
            position: '',
            skills: '',
            projects: '',
            responsibilities: ['']
        }];
    }

    function removeWorkExperience(index: number) {
        workExperiences = workExperiences.filter((_, i) => i !== index);
        if (workExperiences.length === 0) {
            showWorkExperienceForm = false;
        }
    }

    function addResponsibility(experienceIndex: number) {
        workExperiences = workExperiences.map((exp, i) => {
            if (i === experienceIndex) {
                return {
                    ...exp,
                    responsibilities: [...exp.responsibilities, '']
                };
            }
            return exp;
        });
    }

    function removeResponsibility(experienceIndex: number, respIndex: number) {
        workExperiences = workExperiences.map((exp, i) => {
            if (i === experienceIndex) {
                return {
                    ...exp,
                    responsibilities: exp.responsibilities.filter((_, j) => j !== respIndex)
                };
            }
            return exp;
        });
    }

    // Validation
    let errors: string[] = [];
    
    function validateEmail(email: string) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validateUniversitySection() {
        errors = [];
        
        if (!universityData.university.trim()) {
            errors.push("Please enter the university name");
        }
        if (!universityData.country) {
            errors.push("Please select the country");
        }
        if (!universityData.program.trim()) {
            errors.push("Please enter the program name");
        }

        // Validate aspirations
        if (isBestChoiceSelected && !customAspiration.trim()) {
            errors.push("Please share your career goals and aspirations");
        } else if (!isBestChoiceSelected && !selectedAspiration) {
            errors.push("Please select a career path or share your own aspirations");
        }

        // Validate university qualities
        if (isCustomQuality && !customQualityReason.trim()) {
            errors.push("Please share what interests you about this university");
        } else if (!isCustomQuality && selectedQualities.length === 0) {
            errors.push("Please select at least one university quality that interests you");
        }

        return errors.length === 0;
    }

    function validateAcademicsSection() {
        errors = [];
        
        if (!academicsData.highestDegree) {
            errors.push("Please select your highest degree");
        }
        if (!academicsData.fieldOfStudy.trim()) {
            errors.push("Please enter your field of study");
        }
        if (!academicsData.university.trim()) {
            errors.push("Please enter your university/institution name");
        }
        if (academicsData.gpa && (isNaN(parseFloat(academicsData.gpa)) || parseFloat(academicsData.gpa) < 0)) {
            errors.push("Please enter a valid GPA");
        }

        return errors.length === 0;
    }

    function validateWorkExperience() {
        errors = [];
        
        if (showWorkExperienceForm) {
            for (let i = 0; i < workExperiences.length; i++) {
                const exp = workExperiences[i];
                if (!exp.company.trim()) {
                    errors.push(`Please enter company name for Experience ${i + 1}`);
                }
                if (!exp.position.trim()) {
                    errors.push(`Please enter position for Experience ${i + 1}`);
                }
                if (exp.responsibilities.some(r => !r.trim())) {
                    errors.push(`Please fill in all responsibilities for Experience ${i + 1}`);
                }
            }
        }

        return errors.length === 0;
    }

    function handleNext() {
        if (currentStep === 1) {
            if (validateUniversitySection()) {
                currentStep = 2;
                steps = steps.map(step => ({
                    ...step,
                    active: step.number <= currentStep
                }));
            }
        } else if (currentStep === 2) {
            if (validateAcademicsSection()) {
                currentStep = 3;
                steps = steps.map(step => ({
                    ...step,
                    active: step.number <= currentStep
                }));
            }
        } else if (currentStep === 3) {
            if (validateWorkExperience()) {
                currentStep = 4;
                steps = steps.map(step => ({
                    ...step,
                    active: step.number <= currentStep
                }));
            }
        } else if (currentStep === 4) {
            // This is the last step, so no next step is needed.
            // You might want to trigger a submission or final action here.
            steps = steps.map(step => ({
                ...step,
                active: step.number <= currentStep
            }));
        }
    }

    function handleBack() {
        if (currentStep > 1) {
            currentStep--;
            steps = steps.map(step => ({
                ...step,
                active: step.number <= currentStep
            }));
        }
    }

    function addWorkExperience() {
        // This will be implemented when we add the work experience form
        console.log("Adding work experience");
    }

    // Extra-curricular data
    let organizations = [{
        name: '',
        role: '',
        description: ''
    }];

    let communityServices = [{
        organization: '',
        role: '',
        impact: ''
    }];

    let hobbies = '';

    function addOrganization() {
        organizations = [...organizations, {
            name: '',
            role: '',
            description: ''
        }];
    }

    function removeOrganization(index: number) {
        organizations = organizations.filter((_, i) => i !== index);
    }

    function addCommunityService() {
        communityServices = [...communityServices, {
            organization: '',
            role: '',
            impact: ''
        }];
    }

    function removeCommunityService(index: number) {
        communityServices = communityServices.filter((_, i) => i !== index);
    }

    function addAchievement() {
        achievements = [...achievements, {
            title: '',
            description: ''
        }];
    }

    function removeAchievement(index: number) {
        achievements = achievements.filter((_, i) => i !== index);
    }

    // Extra-curricular state
    let showOrganizationsForm = false;
    let showCommunityServiceForm = false;
    let showHobbiesForm = false;
    let showAchievementsForm = false;

    function handleOrganizations() {
        showOrganizationsForm = true;
    }

    function cancelOrganizations() {
        showOrganizationsForm = false;
        organizations = [{
            name: '',
            role: '',
            description: ''
        }];
    }

    function handleCommunityService() {
        showCommunityServiceForm = true;
    }

    function cancelCommunityService() {
        showCommunityServiceForm = false;
        communityServices = [{
            organization: '',
            role: '',
            impact: ''
        }];
    }

    function handleHobbies() {
        showHobbiesForm = true;
    }

    function cancelHobbies() {
        showHobbiesForm = false;
        hobbies = '';
    }

    function handleAchievements() {
        showAchievementsForm = true;
    }

    function cancelAchievements() {
        showAchievementsForm = false;
        achievements = [{
            title: '',
            description: ''
        }];
    }

    // Function to save progress to local storage
    function saveProgress() {
        if (!isLocalStorageAvailable()) return;

        try {
            const progress = {
                currentStep,
                universityData,
                academicsData,
                workExperiences,
                organizations,
                communityServices,
                hobbies,
                achievements,
                lastUpdated: new Date().toISOString(),
                isCompleted: currentStep === totalSteps
            };
            localStorage.setItem('sopProgress', JSON.stringify(progress));
            hasUnfinishedProgress = !progress.isCompleted;
            lastUpdated = progress.lastUpdated;
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    // Function to load progress from local storage
    function loadProgress() {
        if (!isLocalStorageAvailable()) return;

        try {
            const savedProgress = localStorage.getItem('sopProgress');
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                
                // If the SOP was completed and downloaded, don't show the welcome back message
                if (progress.isCompleted) {
                    clearProgress(false); // Clear without confirmation
                    return;
                }

                currentStep = progress.currentStep;
                universityData = progress.universityData;
                academicsData = progress.academicsData;
                workExperiences = progress.workExperiences;
                organizations = progress.organizations;
                communityServices = progress.communityServices;
                hobbies = progress.hobbies;
                achievements = progress.achievements;
                lastUpdated = progress.lastUpdated;
                hasUnfinishedProgress = true;

                // Update steps active state
                steps = steps.map(step => ({
                    ...step,
                    active: step.number <= currentStep
                }));
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            clearProgress(false); // Clear potentially corrupted data without confirmation
        }
    }

    // Function to clear progress
    function clearProgress(showConfirmation = true) {
        if (!isLocalStorageAvailable()) return;

        try {
            if (!showConfirmation || confirm('Are you sure you want to start a new application? This will delete your current progress.')) {
                localStorage.removeItem('sopProgress');
                hasUnfinishedProgress = false;
                lastUpdated = null;
                window.location.reload();
            }
        } catch (error) {
            console.error('Error clearing progress:', error);
        }
    }

    // Save progress whenever data changes
    $: {
        if (currentStep > 1) {  // Only save after user has started filling the form
            saveProgress();
        }
    }

    onMount(() => {
        if (isLocalStorageAvailable()) {
            loadProgress();
        }
    });
</script>

<section class="form-section" id="form-section">
    {#if hasUnfinishedProgress}
        <div class="continue-application">
            <div class="continue-content">
                <div class="continue-text">
                    <h3>Welcome back!</h3>
                    <p>You have an unfinished Statement of Purpose. Would you like to continue where you left off?</p>
                </div>
                <div class="continue-actions">
                    <button class="continue-button" on:click={loadProgress}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                        CONTINUE MY APPLICATION
                    </button>
                    <button class="new-application-button" on:click={() => clearProgress(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Start New Application
                    </button>
                </div>
                {#if lastUpdated}
                    <div class="last-updated">
                        Last edited: {new Date(lastUpdated).toLocaleDateString()}
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <h2 class="title">Ready to craft your perfect Statement of Purpose?</h2>

    <div class="progress-bar">
        {#each steps as step, i}
            <div class="step-container">
                <div class="step-content">
                    <div class="step-number" class:active={step.number <= currentStep}>
                        {step.number}
                    </div>
                    <div class="step-label">{step.label}</div>
                </div>
                {#if i < steps.length - 1}
                    <div class="connector" class:active={step.number < currentStep}></div>
                {/if}
            </div>
        {/each}
    </div>

    {#if currentStep === 1}
        <div class="form-container">
            <div class="info-box">
                Tell us about your academic journey! Fill in these details, and click "Next" to move forward with your SOP creation.
            </div>

            <form class="question-form" on:submit|preventDefault={handleNext}>
                <div class="form-group">
                    <label for="university">
                        Which university or college are you applying to?
                        <span class="required">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="university" 
                        bind:value={universityData.university}
                        placeholder="Eg: Harvard University"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="country">
                        Which country is the college/university located in?
                        <span class="required">*</span>
                    </label>
                    <div class="select-wrapper">
                        <select id="country" bind:value={universityData.country} required>
                            <option value="" disabled selected hidden>Please select a country</option>
                            {#each countries as country}
                                {#if country === '──────────'}
                                    <option disabled class="separator">{country}</option>
                                {:else}
                                    <option value={country}>{country}</option>
                                {/if}
                            {/each}
                        </select>
                        <div class="select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="program">
                        Which degree program interests you?
                        <span class="required">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="program" 
                        bind:value={universityData.program}
                        placeholder="Eg: PhD in Computer Science"
                        required
                    />
                </div>

                <div class="section-divider">Tell us about your future aspirations</div>

                <div class="options-container">
                    <label class="option best-choice" class:expanded={!showOtherOptions}>
                        <input 
                            type="checkbox" 
                            bind:checked={isBestChoiceSelected}
                            on:change={handleBestChoiceChange}
                        />
                        <div class="option-content">
                            <span class="best-choice-tag">Best Choice</span>
                            <span class="option-text">Share your unique vision and career aspirations in your own words</span>
                            {#if showAspirationTextbox}
                                <textarea
                                    class="custom-input"
                                    placeholder="Tell us about your career goals and aspirations..."
                                    bind:value={customAspiration}
                                    required={isBestChoiceSelected}
                                ></textarea>
                            {/if}
                        </div>
                    </label>

                    {#if showOtherOptions}
                        <div class="divider">
                            <span>OR choose from common career paths</span>
                        </div>

                        <label class="option">
                            <input type="radio" name="aspiration" value="executive" bind:group={selectedAspiration} required={!isBestChoiceSelected} />
                            <span class="option-text">Rise to an executive position and lead innovative teams in industry-leading companies</span>
                        </label>

                        <label class="option">
                            <input type="radio" name="aspiration" value="professor" bind:group={selectedAspiration} required={!isBestChoiceSelected} />
                            <span class="option-text">Shape future talent as a university professor and mentor to aspiring professionals</span>
                        </label>

                        <label class="option">
                            <input type="radio" name="aspiration" value="innovator" bind:group={selectedAspiration} required={!isBestChoiceSelected} />
                            <span class="option-text">Pioneer breakthrough solutions that address critical challenges in the industry</span>
                        </label>

                        <label class="option">
                            <input type="radio" name="aspiration" value="policy" bind:group={selectedAspiration} required={!isBestChoiceSelected} />
                            <span class="option-text">Drive positive change through policy-making and strategic industry initiatives</span>
                        </label>

                        <label class="option">
                            <input type="radio" name="aspiration" value="consulting" bind:group={selectedAspiration} required={!isBestChoiceSelected} />
                            <span class="option-text">Launch and grow your own consulting firm, helping businesses overcome complex challenges</span>
                        </label>
                    {/if}
                </div>

                <div class="section-divider">What qualities of this university are you most interested in?</div>

                <div class="options-container">
                    <label class="option best-choice" class:expanded={!showOtherQualities}>
                        <input 
                            type="checkbox" 
                            bind:checked={isCustomQuality}
                            on:change={handleQualityChange}
                        />
                        <div class="option-content">
                            <span class="best-choice-tag">Best Choice</span>
                            <span class="option-text">Share your unique perspective on what draws you to this institution</span>
                            {#if showQualityTextbox}
                                <textarea
                                    class="custom-input"
                                    placeholder="Tell us what specifically interests you about this university..."
                                    bind:value={customQualityReason}
                                    required={isCustomQuality}
                                ></textarea>
                            {/if}
                        </div>
                    </label>

                    {#if showOtherQualities}
                        <div class="divider">
                            <span>OR choose from common options</span>
                        </div>

                        <label class="option">
                            <input type="checkbox" bind:group={selectedQualities} value="research" required={!isCustomQuality && selectedQualities.length === 0} />
                            <span class="option-text">Strong research programs and state-of-the-art facilities</span>
                        </label>

                        <label class="option">
                            <input type="checkbox" bind:group={selectedQualities} value="faculty" />
                            <span class="option-text">Distinguished faculty and academic mentorship opportunities</span>
                        </label>

                        <label class="option">
                            <input type="checkbox" bind:group={selectedQualities} value="industry" />
                            <span class="option-text">Industry connections and career development resources</span>
                        </label>

                        <label class="option">
                            <input type="checkbox" bind:group={selectedQualities} value="diversity" />
                            <span class="option-text">Diverse, international community and cross-cultural learning environment</span>
                        </label>

                        <label class="option">
                            <input type="checkbox" bind:group={selectedQualities} value="reputation" />
                            <span class="option-text">Academic reputation and program ranking in my field of interest</span>
                        </label>
                    {/if}
                </div>

                {#if errors.length > 0}
                    <div class="error-container">
                        <p class="error-heading">Please fix the following issues:</p>
                        <ul>
                            {#each errors as error}
                                <li>{error}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                <div class="button-container">
                    <button type="submit" class="next-button">
                        NEXT <span class="arrow">➜</span>
                    </button>
                </div>
            </form>
        </div>
    {:else if currentStep === 2}
        <div class="form-container">
            <div class="info-box">
                Tell us about your academic background. This will help us highlight your educational journey in your SOP.
            </div>

            <form class="question-form" on:submit|preventDefault={handleNext}>
                <div class="form-group">
                    <label for="highest-degree">
                        What is your highest degree completed/pursuing?
                        <span class="required">*</span>
                    </label>
                    <select 
                        id="highest-degree" 
                        bind:value={academicsData.highestDegree}
                        required
                    >
                        <option value="" disabled selected>Select your highest degree</option>
                        <option value="high-school">High School</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">PhD</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="field-of-study">
                        Field of Study
                        <span class="required">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="field-of-study" 
                        bind:value={academicsData.fieldOfStudy}
                        placeholder="Eg: Computer Science"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="university-name">
                        University/Institution Name
                        <span class="required">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="university-name" 
                        bind:value={academicsData.university}
                        placeholder="Enter your university name"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="gpa">
                        GPA
                        <span class="optional">(Leave empty if you don't want it to be included in your SOP)</span>
                    </label>
                    <input 
                        type="text" 
                        id="gpa" 
                        bind:value={academicsData.gpa}
                        placeholder="E.g., 3.8/4.0, 8.5/10, 85%, etc."
                        class="text-input"
                    />
                </div>

                <div class="form-group">
                    <label for="relevant-courses">
                        Relevant Courses
                        <span class="optional">(Optional)</span>
                    </label>
                    <textarea
                        id="relevant-courses"
                        bind:value={academicsData.relevantCourses}
                        placeholder="E.g., Machine Learning, Data Structures, Algorithms, Database Systems, Computer Networks, etc."
                        class="text-input"
                        rows="3"
                    ></textarea>
                </div>

                <div class="section-divider">
                    <div class="section-header">
                        <span>Projects</span>
                        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                </div>

                {#each projects as project, i}
                    <div class="dynamic-input-container">
                        <div class="input-with-remove">
                            <textarea
                                placeholder="E.g., Developed a machine learning model for healthcare data analysis"
                                bind:value={project.text}
                                class="custom-input"
                            ></textarea>
                            {#if projects.length > 1}
                                <button 
                                    type="button" 
                                    class="remove-button" 
                                    on:click={() => removeProject(i)}
                                    aria-label="Remove project"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}

                <button type="button" class="add-button" on:click={addProject}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Another Project
                </button>

                <div class="section-divider">
                    <div class="section-header">
                        <span>Academic Achievements</span>
                        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                </div>

                {#each achievements as achievement, i}
                    <div class="dynamic-input-container">
                        <div class="input-with-remove">
                            <textarea
                                placeholder="E.g., Received the Dean's List Award for academic excellence"
                                bind:value={achievement.title}
                                class="custom-input"
                            ></textarea>
                            {#if achievements.length > 1}
                                <button 
                                    type="button" 
                                    class="remove-button" 
                                    on:click={() => removeAchievement(i)}
                                    aria-label="Remove achievement"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}

                <button type="button" class="add-button" on:click={addAchievement}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Another Achievement
                </button>

                {#if errors.length > 0}
                    <div class="error-container">
                        <p class="error-heading">Please fix the following issues:</p>
                        <ul>
                            {#each errors as error}
                                <li>{error}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                <div class="button-container">
                    <button type="button" class="back-button" on:click={handleBack}>
                        ← BACK
                    </button>
                    <button type="submit" class="next-button">
                        NEXT <span class="arrow">➜</span>
                    </button>
                </div>
            </form>
        </div>
    {:else if currentStep === 3}
        <div class="form-container">
            <div class="section-header">
                <div class="header-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </div>
                <h2>Work Experience</h2>
            </div>

            <div class="info-alert">
                <div class="info-alert-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
                <div class="info-alert-content">
                    <h3>Important Note</h3>
                    <p>Your work experience significantly strengthens your SOP. Take a moment to detail your professional journey - it could make your application stand out.</p>
                </div>
            </div>

            {#if !showWorkExperienceForm}
                <button type="button" class="add-experience-button" on:click={handleWorkExperience}>
                    <span class="plus-icon">+</span>
                    ADD WORK EXPERIENCE
                </button>
            {:else}
                <div class="form-header">
                    <h3>Work Experience Details</h3>
                    <button type="button" class="cancel-button" on:click={cancelWorkExperience}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                </div>

                {#each workExperiences as experience, expIndex}
                    <div class="experience-form">
                        <div class="experience-header">
                            <h3>Experience {expIndex + 1}</h3>
                            {#if workExperiences.length > 1}
                                <button class="remove-experience" on:click={() => removeWorkExperience(expIndex)} aria-label="Remove work experience">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>

                        <div class="form-group">
                            <label for="company-{expIndex}">Company Name <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="company-{expIndex}" 
                                bind:value={experience.company}
                                placeholder="Eg: Amazon"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="position-{expIndex}">Position <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="position-{expIndex}" 
                                bind:value={experience.position}
                                placeholder="Eg: Software Engineer"
                                required
                            />
                        </div>

                        <div class="responsibilities-section">
                            <label>Key Responsibilities <span class="required">*</span></label>
                            {#each experience.responsibilities as responsibility, respIndex}
                                <div class="responsibility-input">
                                    <input 
                                        type="text" 
                                        bind:value={experience.responsibilities[respIndex]}
                                        placeholder="Eg: Responsible for building & maintaining the backend infrastructure"
                                        required
                                    />
                                    {#if experience.responsibilities.length > 1}
                                        <button 
                                            class="remove-button" 
                                            on:click={() => removeResponsibility(expIndex, respIndex)}
                                            aria-label="Remove responsibility"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    {/if}
                                </div>
                            {/each}
                            <button 
                                type="button" 
                                class="add-responsibility" 
                                on:click={() => addResponsibility(expIndex)}
                            >
                                + Add Another Responsibility
                            </button>
                        </div>

                        <div class="form-group">
                            <label for="company-desc-{expIndex}">Company Description <span class="optional">(Optional)</span></label>
                            <input 
                                type="text" 
                                id="company-desc-{expIndex}" 
                                bind:value={experience.companyDescription}
                                placeholder="Eg: One of the largest e-commerce companies in the world"
                            />
                        </div>

                        <div class="form-group">
                            <label for="skills-{expIndex}">Skills Used <span class="optional">(Optional)</span></label>
                            <input 
                                type="text" 
                                id="skills-{expIndex}" 
                                bind:value={experience.skills}
                                placeholder="Eg: JavaScript, Python, Pandas, RabbitMQ, Redis"
                            />
                        </div>

                        <div class="form-group">
                            <label for="projects-{expIndex}">What projects did you work on? <span class="optional">(Optional)</span></label>
                            <textarea
                                id="projects-{expIndex}"
                                bind:value={experience.projects}
                                placeholder="Eg: Built a chat application using Node.js, RabbitMQ, and Redis. The application handled real-time messaging for over 10,000 concurrent users."
                                class="project-textarea"
                            ></textarea>
                        </div>
                    </div>
                {/each}

                <button type="button" class="add-another-experience" on:click={addNewWorkExperience}>
                    + Add Another Work Experience
                </button>
            {/if}

            {#if errors.length > 0}
                <div class="error-container">
                    <p class="error-heading">Please fix the following issues:</p>
                    <ul>
                        {#each errors as error}
                            <li>{error}</li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <div class="button-container">
                <button type="button" class="back-button" on:click={handleBack}>
                    ← BACK
                </button>
                <button type="button" class="next-button" on:click={handleNext}>
                    NEXT <span class="arrow">➜</span>
                </button>
            </div>
        </div>
    {:else if currentStep === 4}
        <div class="form-container">
            <div class="info-alert">
                <div class="info-alert-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
                <div class="info-alert-content">
                    <p>This section brings your story to life. Your activities, clubs, awards, community service, and hobbies show admissions committees your ability to balance responsibilities, work in teams, and lead.</p>
                    <p>These experiences help paint a vibrant picture of you as a well-rounded individual.</p>
                    <p>Add any sections that are relevant to you.</p>
                </div>
            </div>

            <!-- Organizations and Clubs Section -->
            {#if !showOrganizationsForm}
                <button type="button" class="add-section-button" on:click={handleOrganizations}>
                    <span class="plus-icon">+</span>
                    ADD ORGANIZATIONS & CLUBS
                </button>
            {:else}
                <div class="form-header">
                    <h3>Organizations and Clubs</h3>
                    <button type="button" class="cancel-button" on:click={cancelOrganizations}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                </div>

                {#each organizations as org, orgIndex}
                    <div class="experience-form">
                        <div class="experience-header">
                            <h3>Organization {orgIndex + 1}</h3>
                            {#if organizations.length > 1}
                                <button class="remove-button" on:click={() => removeOrganization(orgIndex)} aria-label="Remove organization">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>

                        <div class="form-group">
                            <label for="org-name-{orgIndex}">Organization Name <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="org-name-{orgIndex}" 
                                bind:value={org.name}
                                placeholder="Eg: Computer Science Society"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="org-role-{orgIndex}">Your Role <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="org-role-{orgIndex}" 
                                bind:value={org.role}
                                placeholder="Eg: Vice President"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="org-desc-{orgIndex}">Description <span class="required">*</span></label>
                            <textarea
                                id="org-desc-{orgIndex}"
                                bind:value={org.description}
                                placeholder="Describe your responsibilities and achievements in this role"
                                class="description-textarea"
                                required
                            ></textarea>
                        </div>
                    </div>
                {/each}

                <button class="add-button" on:click={addOrganization}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    NEW ORGANIZATION/CLUB
                </button>
            {/if}

            <!-- Community Service Section -->
            {#if !showCommunityServiceForm}
                <button type="button" class="add-section-button" on:click={handleCommunityService}>
                    <span class="plus-icon">+</span>
                    ADD COMMUNITY SERVICE
                </button>
            {:else}
                <div class="form-header">
                    <h3>Community Service</h3>
                    <button type="button" class="cancel-button" on:click={cancelCommunityService}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                </div>

                {#each communityServices as service, serviceIndex}
                    <div class="experience-form">
                        <div class="experience-header">
                            <h3>Experience {serviceIndex + 1}</h3>
                            {#if communityServices.length > 1}
                                <button class="remove-button" on:click={() => removeCommunityService(serviceIndex)} aria-label="Remove community service">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>

                        <div class="form-group">
                            <label for="service-org-{serviceIndex}">Organization <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="service-org-{serviceIndex}" 
                                bind:value={service.organization}
                                placeholder="Eg: Local Food Bank"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="service-role-{serviceIndex}">Your Role <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="service-role-{serviceIndex}" 
                                bind:value={service.role}
                                placeholder="Eg: Volunteer Coordinator"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="service-impact-{serviceIndex}">Impact <span class="required">*</span></label>
                            <textarea
                                id="service-impact-{serviceIndex}"
                                bind:value={service.impact}
                                placeholder="Describe the impact of your service and what you learned"
                                class="description-textarea"
                                required
                            ></textarea>
                        </div>
                    </div>
                {/each}

                <button class="add-button" on:click={addCommunityService}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    NEW COMMUNITY SERVICE
                </button>
            {/if}

            <!-- Hobbies Section -->
            {#if !showHobbiesForm}
                <button type="button" class="add-section-button" on:click={handleHobbies}>
                    <span class="plus-icon">+</span>
                    ADD HOBBIES & INTERESTS
                </button>
            {:else}
                <div class="form-header">
                    <h3>Hobbies & Interests</h3>
                    <button type="button" class="cancel-button" on:click={cancelHobbies}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                </div>

                <div class="form-group">
                    <label for="hobbies">Share your hobbies and interests <span class="required">*</span></label>
                    <textarea
                        id="hobbies"
                        bind:value={hobbies}
                        placeholder="Eg: Enjoy capturing moments through photography, participating in local chess tournaments, maintaining a tech blog about AI developments..."
                        class="description-textarea"
                        required
                    ></textarea>
                </div>
            {/if}

            <!-- Awards and Achievements Section -->
            {#if !showAchievementsForm}
                <button type="button" class="add-section-button" on:click={handleAchievements}>
                    <span class="plus-icon">+</span>
                    ADD AWARDS & ACHIEVEMENTS
                </button>
            {:else}
                <div class="form-header">
                    <h3>Awards & Achievements</h3>
                    <button type="button" class="cancel-button" on:click={cancelAchievements}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                </div>

                {#each achievements as achievement, achievementIndex}
                    <div class="experience-form">
                        <div class="experience-header">
                            <h3>Achievement {achievementIndex + 1}</h3>
                            {#if achievements.length > 1}
                                <button class="remove-button" on:click={() => removeAchievement(achievementIndex)} aria-label="Remove achievement">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/if}
                        </div>

                        <div class="form-group">
                            <label for="achievement-title-{achievementIndex}">Title <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="achievement-title-{achievementIndex}" 
                                bind:value={achievement.title}
                                placeholder="Eg: First Place in National Coding Competition"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="achievement-desc-{achievementIndex}">Description <span class="required">*</span></label>
                            <textarea
                                id="achievement-desc-{achievementIndex}"
                                bind:value={achievement.description}
                                placeholder="Describe the achievement and its significance"
                                class="description-textarea"
                                required
                            ></textarea>
                        </div>
                    </div>
                {/each}

                <button class="add-button" on:click={addAchievement}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    NEW ACHIEVEMENT
                </button>
            {/if}

            <div class="button-container">
                <button type="button" class="back-button" on:click={handleBack}>
                    ← BACK
                </button>
                <button type="button" class="next-button" on:click={handleNext}>
                    NEXT <span class="arrow">➜</span>
                </button>
            </div>
        </div>
    {/if}
</section>

<style lang="postcss">
    .form-section {
        padding: 4rem 1rem 2rem;
        max-width: 1000px;
        margin: 0 auto;
    }

    .title {
        text-align: center;
        font-size: 1.75rem;
        font-weight: 500;
        color: #1E293B;
        margin-bottom: 3rem;
    }

    .progress-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4rem;
        padding: 0 2rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    .step-container {
        display: flex;
        align-items: center;
        position: relative;
        flex: 1;
    }

    .step-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        z-index: 1;
        width: 100%;
    }

    .step-number {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background-color: #E2E8F0;
        color: #64748B;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .step-number.active {
        background-color: #2196F3;
        color: white;
    }

    .step-label {
        text-align: center;
        color: #64748B;
        font-size: 0.9rem;
        white-space: nowrap;
    }

    .connector {
        position: absolute;
        left: calc(50% + 1.25rem);
        right: calc(-50% + 1.25rem);
        top: 1.25rem;
        height: 2px;
        background-color: #E2E8F0;
        z-index: 0;
    }

    .connector.active {
        background-color: #2196F3;
    }

    .info-box {
        background-color: #F0F9FF;
        border-radius: 0.5rem;
        padding: 1.25rem;
        margin-bottom: 2rem;
        color: #0369A1;
        font-size: 1.1rem;
        line-height: 1.5;
    }

    .form-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #1E293B;
        font-weight: 500;
        font-size: 1.1rem;
    }

    .required {
        color: #EF4444;
        margin-left: 0.25rem;
    }

    input[type="text"] {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
    }

    input[type="text"]:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    input[type="text"]::placeholder {
        color: #94A3B8;
    }

    .select-wrapper {
        position: relative;
        width: 100%;
    }

    select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #E2E8F0;
        border-radius: 0.375rem;
        font-size: 1rem;
        font-family: inherit;
        color: #1E293B;
        background-color: white;
        transition: all 0.2s ease;
        cursor: pointer;
        appearance: none;
        padding-right: 2.5rem;
    }

    select:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    select option {
        padding: 0.625rem 1rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        line-height: 1;
        height: 40px;
    }

    select option.separator {
        color: #94A3B8;
        background-color: #F8FAFC;
        font-size: 0.875rem;
        text-align: center;
        border-bottom: 1px solid #E2E8F0;
        border-top: 1px solid #E2E8F0;
        padding: 0.25rem 0;
        height: 30px;
    }

    .select-arrow {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #64748B;
        transition: color 0.2s ease;
    }

    select:hover + .select-arrow {
        color: #2196F3;
    }

    select:focus + .select-arrow {
        color: #2196F3;
        transform: translateY(-50%) rotate(180deg);
    }

    .aspirations-section {
        background-color: #F0F9FF;
        padding: 2rem 1rem;
    }

    .qualities-section {
        padding: 2rem 1rem;
        background-color: white;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
    }

    .section-title {
        color: #1E293B;
        font-size: 1.25rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .options-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .option {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
    }

    .option:hover {
        border-color: #2196F3;
        background-color: #F0F9FF;
    }

    .option.best-choice {
        border-color: #2196F3;
        background-color: white;
    }

    .option.best-choice.expanded {
        flex: 1;
        margin-bottom: 0;
    }

    .option.best-choice:has(input:checked) {
        background-color: #F0F9FF;
        border-color: #2196F3;
        border-width: 2px;
    }

    .option-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .best-choice-tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: #2196F3;
        color: white;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        width: fit-content;
    }

    .option-text {
        color: #1E293B;
        font-size: 0.9375rem;
        line-height: 1.5;
    }

    .divider {
        position: relative;
        text-align: center;
        margin: 1.5rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #E2E8F0;
    }

    .divider span {
        color: #64748B;
        font-size: 0.875rem;
        white-space: nowrap;
        padding: 0 0.5rem;
    }

    input[type="radio"],
    input[type="checkbox"] {
        width: 1.25rem;
        height: 1.25rem;
        margin-top: 0.25rem;
        border: 2px solid #CBD5E1;
        cursor: pointer;
    }

    input[type="radio"] {
        border-radius: 50%;
    }

    input[type="checkbox"] {
        border-radius: 0.25rem;
    }

    input[type="radio"]:checked,
    input[type="checkbox"]:checked {
        background-color: #2196F3;
        border-color: #2196F3;
    }

    .custom-input {
        margin-top: 1rem;
        width: 100%;
        min-height: 120px;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        resize: vertical;
        font-family: inherit;
        line-height: 1.5;
    }

    .custom-input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .custom-input::placeholder {
        color: #94A3B8;
    }

    @media (max-width: 768px) {
        .progress-bar {
            padding: 0;
        }

        .step-label {
            font-size: 0.75rem;
        }

        .form-container {
            padding: 1rem;
        }

        .connector {
            left: calc(50% + 1rem);
            right: calc(-50% + 1rem);
        }

        .aspirations-section,
        .qualities-section {
            padding: 1.5rem 1rem;
        }

        .option {
            padding: 0.875rem;
        }
    }

    .user-info-section {
        padding: 2rem 1rem;
        background-color: #F0F9FF;
    }

    .form-group {
        margin-bottom: 1.5rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #1E293B;
        font-weight: 500;
        font-size: 1rem;
    }

    .required {
        color: #EF4444;
        margin-left: 0.25rem;
    }

    input[type="text"],
    input[type="email"] {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
    }

    input[type="text"]:focus,
    input[type="email"]:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    input[type="text"]::placeholder,
    input[type="email"]::placeholder {
        color: #94A3B8;
    }

    .button-container {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
    }

    .next-button {
        background-color: #2196F3;
        color: white;
        padding: 1rem 3rem;
        border-radius: 0.5rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3);
    }

    .next-button:hover {
        background-color: #1976D2;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(33, 150, 243, 0.4);
    }

    .arrow {
        font-size: 1.25rem;
    }

    @media (max-width: 640px) {
        .form-group {
            padding: 0;
        }

        .next-button {
            width: 100%;
            justify-content: center;
        }
    }

    .testimonials-section {
        padding: 4rem 1rem;
        background: #F0F9FF;
    }

    .testimonials-subtitle {
        color: #1E293B;
        font-size: 2.5rem;
        font-weight: 600;
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .testimonials-description {
        color: #64748B;
        font-size: 1.1rem;
        text-align: center;
        margin-bottom: 3rem;
    }

    .testimonials-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .testimonial-card {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .testimonial-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        background: #F8FAFC;
    }

    .quote-mark {
        color: #2196F3;
        font-size: 4rem;
        font-weight: bold;
        position: absolute;
        top: 1rem;
        left: 1.5rem;
        opacity: 0.1;
        font-family: serif;
    }

    .testimonial-text {
        color: #1E293B;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
        position: relative;
        z-index: 1;
    }

    .testimonial-author {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .author-info {
        display: flex;
        flex-direction: column;
    }

    .author-name {
        color: #1E293B;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .author-title {
        color: #64748B;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0 1rem;
        }

        .testimonials-subtitle {
            font-size: 2rem;
        }

        .testimonial-card {
            padding: 1.5rem;
        }
    }

    .error-container {
        background-color: #FEE2E2;
        border: 1px solid #EF4444;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .error-heading {
        color: #B91C1C;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .error-container ul {
        list-style-type: disc;
        margin-left: 1.5rem;
        color: #B91C1C;
    }

    .error-container li {
        margin-bottom: 0.25rem;
    }

    .gpa-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .gpa-container .text-input {
        flex: 1;
    }

    .scale-select {
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
        cursor: pointer;
    }

    .scale-select:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .back-button {
        background-color: #64748B;
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 6px rgba(100, 116, 139, 0.3);
    }

    .back-button:hover {
        background-color: #475569;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(100, 116, 139, 0.4);
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    @media (max-width: 640px) {
        .button-container {
            flex-direction: column;
        }

        .back-button,
        .next-button {
            width: 100%;
            justify-content: center;
        }
    }

    .section-divider {
        font-size: 1.25rem;
        font-weight: 500;
        color: #1E293B;
        margin: 2.5rem 0 1.5rem;
        text-align: left;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #E2E8F0;
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .header-icon {
        color: #2196F3;
    }

    .section-header h2 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
    }

    .warning-box {
        background-color: #FFF7E6;
        border: 1px solid #FFB020;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .warning-icon {
        font-size: 1.5rem;
        line-height: 1;
    }

    .warning-content h3 {
        color: #B76E00;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .warning-content p {
        color: #92400E;
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
    }

    .add-experience-button {
        background-color: #6366F1;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 2rem auto;
        transition: all 0.2s ease;
    }

    .add-experience-button:hover {
        background-color: #4F46E5;
        transform: translateY(-2px);
    }

    .plus-icon {
        font-size: 1.5rem;
        font-weight: 400;
    }

    .dynamic-input-container {
        margin-bottom: 1rem;
    }

    .input-with-remove {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .remove-button {
        background: none;
        border: none;
        color: #EF4444;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
    }

    .remove-button:hover {
        background-color: #FEE2E2;
    }

    .add-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: 2px dashed #CBD5E1;
        color: #64748B;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        width: 100%;
        justify-content: center;
        font-weight: 500;
        margin-bottom: 2rem;
        transition: all 0.2s ease;
    }

    .add-button:hover {
        border-color: #2196F3;
        color: #2196F3;
        background-color: #F0F9FF;
    }

    .custom-input {
        min-height: 80px;
        width: 100%;
    }

    .optional {
        color: #64748B;
        font-size: 0.875rem;
        font-weight: normal;
        margin-left: 0.5rem;
    }

    .text-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
        font-family: inherit;
    }

    .text-input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .text-input::placeholder {
        color: #94A3B8;
    }

    .gpa-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .gpa-container .text-input {
        flex: 1;
    }

    .scale-select {
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
        cursor: pointer;
    }

    .scale-select:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .info-alert {
        background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
        border-left: 4px solid #2196F3;
    }

    .info-alert-icon {
        color: #2196F3;
        flex-shrink: 0;
    }

    .info-alert-content h3 {
        color: #1565C0;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .info-alert-content p {
        color: #1976D2;
        font-size: 1rem;
        line-height: 1.6;
        margin: 0;
    }

    .experience-form {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .experience-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .experience-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
    }

    .remove-experience {
        background: none;
        border: none;
        color: #EF4444;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        transition: all 0.2s ease;
    }

    .remove-experience:hover {
        background-color: #FEE2E2;
    }

    .date-range {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .current-job {
        grid-column: span 2;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #1E293B;
        font-size: 0.95rem;
    }

    .responsibilities-section {
        margin-top: 1.5rem;
    }

    .responsibility-input {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .add-responsibility {
        background: none;
        border: none;
        color: #2196F3;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
    }

    .add-responsibility:hover {
        background-color: #E3F2FD;
    }

    .add-another-experience {
        width: 100%;
        padding: 1rem;
        background-color: #E3F2FD;
        color: #2196F3;
        border: 2px dashed #2196F3;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s ease;
    }

    .add-another-experience:hover {
        background-color: #BBDEFB;
    }

    input[type="month"] {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
    }

    input[type="month"]:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .project-textarea {
        min-height: 120px;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
        font-family: inherit;
        line-height: 1.5;
    }

    .project-textarea:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .project-textarea::placeholder {
        color: #94A3B8;
    }

    .description-textarea {
        min-height: 100px;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #CBD5E1;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1E293B;
        background-color: white;
        transition: border-color 0.2s ease;
        font-family: inherit;
        line-height: 1.5;
        resize: vertical;
    }

    .description-textarea:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .description-textarea::placeholder {
        color: #94A3B8;
    }

    .section-divider {
        margin: 2.5rem 0 1.5rem;
        border-bottom: 2px solid #E2E8F0;
    }

    .section-divider h3 {
        color: #1E293B;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .add-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        background-color: #F1F5F9;
        color: #2196F3;
        border: 2px dashed #2196F3;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        margin: 1rem 0;
    }

    .add-button:hover {
        background-color: #E3F2FD;
    }

    .add-button svg {
        color: currentColor;
    }

    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .form-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
    }

    .cancel-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        color: #EF4444;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
    }

    .cancel-button:hover {
        background-color: #FEE2E2;
    }

    .cancel-button svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .add-section-button {
        background-color: #F8FAFC;
        color: #2196F3;
        border: 2px dashed #2196F3;
        border-radius: 0.5rem;
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 1.5rem 0;
        width: 100%;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .add-section-button:hover {
        background-color: #E3F2FD;
        transform: translateY(-2px);
    }

    .plus-icon {
        font-size: 1.5rem;
        font-weight: 400;
    }

    .continue-application {
        background: #F0F9FF;
        border: 1px solid #BAE6FD;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 3rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .continue-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .continue-text h3 {
        color: #0369A1;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .continue-text p {
        color: #0C4A6E;
        font-size: 1.1rem;
        line-height: 1.5;
        margin: 0;
    }

    .continue-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .continue-button {
        background: #0EA5E9;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .continue-button:hover {
        background: #0284C7;
        transform: translateY(-2px);
    }

    .new-application-button {
        background: white;
        color: #0EA5E9;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: 2px solid #0EA5E9;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .new-application-button:hover {
        background: #F0F9FF;
        transform: translateY(-2px);
    }

    .last-updated {
        color: #64748B;
        font-size: 0.9rem;
        text-align: right;
    }
</style> 