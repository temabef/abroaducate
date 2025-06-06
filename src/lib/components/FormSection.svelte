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

<div class="form-section">
    <div class="progress-bar-container">
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
                            <label for="responsibility-input-0-{expIndex}">Key Responsibilities <span class="required">*</span></label>
                            {#each experience.responsibilities as responsibility, respIndex}
                                <div class="responsibility-input">
                                    <input 
                                        type="text" 
                                        id="responsibility-input-{respIndex}-{expIndex}" 
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
</div>