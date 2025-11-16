<script lang="ts">
    import { 
        cvFormStore, 
        addEducation, 
        removeEducation, 
        addExperience, 
        removeExperience,
        addPublication,
        removePublication,
        addAward,
        removeAward
    } from '$lib/stores/cvStore';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    // Step-by-step navigation
    let currentSectionIndex = 0;
    const sections = [
        { id: 'personal', label: 'Personal Info', icon: '👤' },
        { id: 'education', label: 'Education', icon: '🎓' },
        { id: 'experience', label: 'Experience', icon: '💼' },
        { id: 'publications', label: 'Publications', icon: '📚' },
        { id: 'skills', label: 'Skills', icon: '🛠️' },
        { id: 'awards', label: 'Awards', icon: '🏆' },
        { id: 'optional', label: 'Optional', icon: '📋' }
    ];
    let currentSection = sections[currentSectionIndex].id;

    // Update currentSection when index changes
    $: currentSection = sections[currentSectionIndex].id;
    
    // Initialize error arrays when data changes
    $: educationErrors = $cvFormStore.education.map(() => []);
    $: experienceErrors = $cvFormStore.experience.map(() => []);
    $: publicationErrors = $cvFormStore.publications.map(() => []);
    $: awardErrors = $cvFormStore.awards.map(() => []);
    $: languageErrors = $cvFormStore.skills.languages.map(() => []);

    // Validation error states
    let fullNameError = '';
    let emailError = '';
    let phoneError = '';
    let addressError = '';
    let websiteError = '';
    let orcidError = '';
    let academicFieldError = '';
    let skillErrors: { technical: string[], software: string[] } = { technical: [], software: [] };

    // Validation functions
    function validateFullName() {
        const fullName = $cvFormStore.personalInfo.fullName.trim();
        if (!fullName) {
            fullNameError = 'Full name is required';
        } else if (fullName.length < 2) {
            fullNameError = 'Full name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
            fullNameError = 'Full name should only contain letters and spaces';
        } else {
            fullNameError = '';
        }
    }

    function validateEmail() {
        const email = $cvFormStore.personalInfo.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            emailError = 'Email is required';
        } else if (!emailRegex.test(email)) {
            emailError = 'Please enter a valid email address';
        } else {
            emailError = '';
        }
    }

    function validatePhone() {
        const phone = $cvFormStore.personalInfo.phone.trim();
        if (phone && phone.length < 10) {
            phoneError = 'Phone number must be at least 10 digits';
        } else {
            phoneError = '';
        }
    }

    function validateAddress() {
        const address = $cvFormStore.personalInfo.address.trim();
        if (address && address.length < 5) {
            addressError = 'Address must be at least 5 characters';
        } else {
            addressError = '';
        }
    }

    function validateWebsite() {
        const website = $cvFormStore.personalInfo.website.trim();
        if (website) {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(website)) {
                websiteError = 'Website must be a valid URL starting with http:// or https://';
            } else {
                websiteError = '';
            }
        } else {
            websiteError = '';
        }
    }

    function validateOrcid() {
        const orcid = $cvFormStore.personalInfo.orcid.trim();
        if (orcid) {
            const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
            if (!orcidRegex.test(orcid)) {
                orcidError = 'ORCID must be in format: 0000-0000-0000-0000';
            } else {
                orcidError = '';
            }
        } else {
            orcidError = '';
        }
    }

    function validateAcademicField() {
        const academicField = $cvFormStore.academicField;
        if (!academicField) {
            academicFieldError = 'Academic field is required';
        } else {
            academicFieldError = '';
        }
    }

    function validateEducation() {
        educationErrors = $cvFormStore.education.map(edu => {
            const errors: string[] = [];
            if (!edu.degree?.trim()) errors.push('Degree is required');
            if (!edu.institution?.trim()) errors.push('Institution is required');
            if (!edu.year?.trim()) errors.push('Year is required');
            if (edu.degree?.trim() && edu.degree.length < 3) errors.push('Degree must be at least 3 characters');
            if (edu.institution?.trim() && edu.institution.length < 2) errors.push('Institution must be at least 2 characters');
            return errors;
        });
    }

    function validateExperience() {
        experienceErrors = $cvFormStore.experience.map(exp => {
            const errors: string[] = [];
            if (!exp.title?.trim()) errors.push('Title is required');
            if (!exp.institution?.trim()) errors.push('Institution is required');
            if (!exp.duration?.trim()) errors.push('Duration is required');
            if (exp.title?.trim() && exp.title.length < 3) errors.push('Title must be at least 3 characters');
            if (exp.institution?.trim() && exp.institution.length < 2) errors.push('Institution must be at least 2 characters');
            return errors;
        });
    }

    function validatePublications() {
        publicationErrors = $cvFormStore.publications.map(pub => {
            const errors: string[] = [];
            if (!pub.title?.trim()) errors.push('Title is required');
            if (!pub.authors?.trim()) errors.push('Authors are required');
            if (pub.title?.trim() && pub.title.length < 5) errors.push('Title must be at least 5 characters');
            if (pub.authors?.trim() && pub.authors.length < 3) errors.push('Authors must be at least 3 characters');
            return errors;
        });
    }

    function validateAwards() {
        awardErrors = $cvFormStore.awards.map(award => {
            const errors: string[] = [];
            if (!award.title?.trim()) errors.push('Award title is required');
            if (!award.organization?.trim()) errors.push('Organization is required');
            if (award.title?.trim() && award.title.length < 3) errors.push('Award title must be at least 3 characters');
            if (award.organization?.trim() && award.organization.length < 2) errors.push('Organization must be at least 2 characters');
            return errors;
        });
    }

    function validateSkills() {
        skillErrors = {
            technical: $cvFormStore.skills.technical.map(skill => 
                skill.trim() && skill.length < 2 ? 'Skill must be at least 2 characters' : ''
            ),
            software: $cvFormStore.skills.software.map(skill => 
                skill.trim() && skill.length < 2 ? 'Software must be at least 2 characters' : ''
            )
        };
    }

    function validateLanguages() {
        languageErrors = $cvFormStore.skills.languages.map(lang => {
            const errors: string[] = [];
            if (!lang.language?.trim()) errors.push('Language is required');
            if (!lang.proficiency?.trim()) errors.push('Proficiency is required');
            if (lang.language?.trim() && lang.language.length < 2) errors.push('Language must be at least 2 characters');
            return errors;
        });
    }

    // Validate current section
    function validateCurrentSection() {
        if (currentSection === 'personal') {
            validateFullName();
            validateEmail();
            validatePhone();
            validateAddress();
            validateWebsite();
            validateOrcid();
            validateAcademicField();
        } else if (currentSection === 'education') {
            validateEducation();
        } else if (currentSection === 'experience') {
            validateExperience();
        } else if (currentSection === 'publications') {
            validatePublications();
        } else if (currentSection === 'skills') {
            validateSkills();
            validateLanguages();
        } else if (currentSection === 'awards') {
            validateAwards();
        }
    }

    // Check if current section is valid
    function isCurrentSectionValid(): boolean {
        validateCurrentSection();
        
        if (currentSection === 'personal') {
            return !fullNameError && !emailError && !phoneError && !addressError && 
                   !websiteError && !orcidError && !academicFieldError;
        } else if (currentSection === 'education') {
            return educationErrors.every(errors => errors.length === 0);
        } else if (currentSection === 'experience') {
            return experienceErrors.every(errors => errors.length === 0);
        } else if (currentSection === 'publications') {
            return publicationErrors.every(errors => errors.length === 0);
        } else if (currentSection === 'skills') {
            return skillErrors.technical.every(error => !error) && 
                   skillErrors.software.every(error => !error) &&
                   languageErrors.every(errors => errors.length === 0);
        } else if (currentSection === 'awards') {
            return awardErrors.every(errors => errors.length === 0);
        }
        
        return true;
    }

    function goToSection(index: number) {
        // Only allow going back or to current
        if (index <= currentSectionIndex) {
            currentSectionIndex = index;
        }
    }
    
    function nextSection() {
        if (currentSectionIndex < sections.length - 1 && isCurrentSectionValid()) {
            currentSectionIndex++;
        }
    }
    
    function prevSection() {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
        }
    }

    let showValidationModal = false;
    let missingFields: string[] = [];

    function validateRequiredFields() {
        missingFields = [];
        if (!$cvFormStore.personalInfo.fullName) missingFields.push('Full Name');
        if (!$cvFormStore.personalInfo.email) missingFields.push('Email');
        if (!$cvFormStore.academicField) missingFields.push('Academic Field');
        
        // Validate education entries
        $cvFormStore.education.forEach((edu, index) => {
            if (!edu.degree) missingFields.push(`Education ${index + 1}: Degree`);
            if (!edu.institution) missingFields.push(`Education ${index + 1}: Institution`);
            if (!edu.year) missingFields.push(`Education ${index + 1}: Year`);
        });
        
        return missingFields.length === 0;
    }

    function handleGenerate() {
        if (!validateRequiredFields()) {
            showValidationModal = true;
            return;
        }
        dispatch('generate');
    }
    
    function closeValidationModal() {
        showValidationModal = false;
    }
    
    function addSkill(type: 'technical' | 'software') {
        cvFormStore.update(data => ({
            ...data,
            skills: {
                ...data.skills,
                [type]: [...data.skills[type], '']
            }
        }));
    }
    
    function removeSkill(type: 'technical' | 'software', index: number) {
        cvFormStore.update(data => ({
            ...data,
            skills: {
                ...data.skills,
                [type]: data.skills[type].filter((_, i) => i !== index)
            }
        }));
    }
    
    function addLanguage() {
        cvFormStore.update(data => ({
            ...data,
            skills: {
                ...data.skills,
                languages: [...data.skills.languages, { language: '', proficiency: '' }]
            }
        }));
    }
    
    function removeLanguage(index: number) {
        cvFormStore.update(data => ({
            ...data,
            skills: {
                ...data.skills,
                languages: data.skills.languages.filter((_, i) => i !== index)
            }
        }));
    }
</script>

<div class="bg-white rounded-lg shadow-lg p-8">
    <!-- Section Navigation -->
    <div class="flex flex-wrap gap-2 mb-8 border-b pb-4">
        {#each sections as section, i}
                            <button
                    onclick={() => goToSection(i)}
                    class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors {currentSection === section.id ? 'bg-[#2C3580] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                    disabled={i > currentSectionIndex}
                >
                <span>{section.icon}</span>
                {section.label}
            </button>
        {/each}
    </div>

    <!-- Personal Information -->
    {#if currentSection === 'personal'}
        <div class="space-y-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">👤 Personal Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.fullName}
                        oninput={validateFullName}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Dr. Jane Smith"
                    >
                    {#if fullNameError}
                        <p class="text-red-500 text-xs mt-1">{fullNameError}</p>
                    {/if}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.email}
                        oninput={validateEmail}
                        type="email" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="jane.smith@university.edu"
                    >
                    {#if emailError}
                        <p class="text-red-500 text-xs mt-1">{emailError}</p>
                    {/if}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.phone}
                        oninput={validatePhone}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                    >
                    {#if phoneError}
                        <p class="text-red-500 text-xs mt-1">{phoneError}</p>
                    {/if}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.address}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="City, State, Country"
                    >
                    {#if addressError}
                        <p class="text-red-500 text-xs mt-1">{addressError}</p>
                    {/if}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Website/Portfolio</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.website}
                        type="url" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://www.yoursite.com"
                    >
                    {#if websiteError}
                        <p class="text-red-500 text-xs mt-1">{websiteError}</p>
                    {/if}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ORCID ID</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.orcid}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0000-0000-0000-0000"
                    >
                    {#if orcidError}
                        <p class="text-red-500 text-xs mt-1">{orcidError}</p>
                    {/if}
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Academic Field *</label>
                <select 
                    bind:value={$cvFormStore.academicField}
                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="stem">STEM (Science, Technology, Engineering, Math)</option>
                    <option value="humanities">Humanities</option>
                    <option value="social_sciences">Social Sciences</option>
                    <option value="medical">Medical & Health Sciences</option>
                    <option value="business">Business & Economics</option>
                    <option value="arts">Arts & Creative Fields</option>
                    <option value="other">Other</option>
                </select>
                {#if academicFieldError}
                    <p class="text-red-500 text-xs mt-1">{academicFieldError}</p>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Education -->
    {#if currentSection === 'education'}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">🎓 Education</h3>
                <button 
                    onclick={addEducation}
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Add Education
                </button>
            </div>
            
            {#each $cvFormStore.education as edu, index}
                <div class="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900">Education #{index + 1}</h4>
                        <button 
                            onclick={() => removeEducation(index)}
                            class="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                            <input 
                                bind:value={edu.degree}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ph.D. in Computer Science"
                            >
                            {#if educationErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each educationErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                            <input 
                                bind:value={edu.institution}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Stanford University"
                            >
                            {#if educationErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each educationErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input 
                                bind:value={edu.year}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2020 or 2018-2022"
                            >
                            {#if educationErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each educationErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input 
                                bind:value={edu.location}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Stanford, CA, USA"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">GPA (if strong)</label>
                            <input 
                                bind:value={edu.gpa}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="3.9/4.0"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Advisor/Supervisor</label>
                            <input 
                                bind:value={edu.advisor}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Prof. John Doe"
                            >
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Thesis/Dissertation Title</label>
                        <textarea 
                            bind:value={edu.thesis}
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows="2"
                            placeholder="Your thesis or dissertation title"
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            {#if $cvFormStore.education.length === 0}
                <div class="text-center py-8 text-gray-500">
                    No education entries yet. Click "Add Education" to get started.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Experience -->
    {#if currentSection === 'experience'}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">💼 Professional Experience</h3>
                <button 
                    onclick={addExperience}
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Add Experience
                </button>
            </div>
            
            {#each $cvFormStore.experience as exp, index}
                <div class="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900">Experience #{index + 1}</h4>
                        <button 
                            onclick={() => removeExperience(index)}
                            class="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
                            <input 
                                bind:value={exp.title}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Postdoctoral Researcher"
                            >
                            {#if experienceErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each experienceErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Institution/Company *</label>
                            <input 
                                bind:value={exp.institution}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="MIT"
                            >
                            {#if experienceErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each experienceErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                            <input 
                                bind:value={exp.duration}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2020-Present or Jan 2020 - Dec 2022"
                            >
                            {#if experienceErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each experienceErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input 
                                bind:value={exp.location}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Cambridge, MA, USA"
                            >
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description & Achievements</label>
                        <textarea 
                            bind:value={exp.description}
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows="4"
                            placeholder="• Led research on machine learning algorithms\n• Published 5 papers in top-tier journals\n• Supervised 3 graduate students"
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            {#if $cvFormStore.experience.length === 0}
                <div class="text-center py-8 text-gray-500">
                    No experience entries yet. Click "Add Experience" to get started.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Publications -->
    {#if currentSection === 'publications'}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">📚 Publications</h3>
                <button 
                    onclick={addPublication}
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Add Publication
                </button>
            </div>
            
            {#each $cvFormStore.publications as pub, index}
                <div class="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900">Publication #{index + 1}</h4>
                        <button 
                            onclick={() => removePublication(index)}
                            class="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input 
                                bind:value={pub.title}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Deep Learning Approaches for Natural Language Processing"
                            >
                            {#if publicationErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each publicationErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Authors *</label>
                            <input 
                                bind:value={pub.authors}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Smith, J., Johnson, A., & Brown, C."
                            >
                            {#if publicationErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each publicationErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Journal/Conference *</label>
                                <input 
                                    bind:value={pub.journal}
                                    type="text" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Nature Communications"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                                <input 
                                    bind:value={pub.year}
                                    type="text" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="2023"
                                >
                                {#if publicationErrors[index].length > 0}
                                    <ul class="text-red-500 text-xs mt-1">
                                        {#each publicationErrors[index] as error}
                                            <li>• {error}</li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">DOI (optional)</label>
                            <input 
                                bind:value={pub.doi}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="10.1038/s41467-023-12345-6"
                            >
                        </div>
                    </div>
                </div>
            {/each}
            
            {#if $cvFormStore.publications.length === 0}
                <div class="text-center py-8 text-gray-500">
                    No publications yet. Click "Add Publication" to get started.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Skills -->
    {#if currentSection === 'skills'}
        <div class="space-y-8">
            <h3 class="text-xl font-bold text-gray-900">🛠️ Skills & Competencies</h3>
            
            <!-- Technical Skills -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-medium text-gray-800">Technical Skills</h4>
                    <button 
                        onclick={() => addSkill('technical')}
                        class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                        + Add Skill
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {#each $cvFormStore.skills.technical as skill, index}
                        <div class="flex gap-2">
                            <input 
                                bind:value={$cvFormStore.skills.technical[index]}
                                type="text" 
                                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Machine Learning, Data Analysis, etc."
                            >
                            <button 
                                onclick={() => removeSkill('technical', index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
                        {#if skillErrors.technical[index]}
                            <p class="text-red-500 text-xs mt-1">{skillErrors.technical[index]}</p>
                        {/if}
                    {/each}
                </div>
            </div>
            
            <!-- Languages -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-medium text-gray-800">Languages</h4>
                    <button 
                        onclick={addLanguage}
                        class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                        + Add Language
                    </button>
                </div>
                
                <div class="space-y-3">
                    {#each $cvFormStore.skills.languages as lang, index}
                        <div class="flex gap-3">
                            <input 
                                bind:value={lang.language}
                                type="text" 
                                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Spanish"
                            >
                            <select 
                                bind:value={lang.proficiency}
                                class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Proficiency</option>
                                <option value="Native">Native</option>
                                <option value="Fluent">Fluent</option>
                                <option value="Proficient">Proficient</option>
                                <option value="Conversational">Conversational</option>
                                <option value="Basic">Basic</option>
                            </select>
                            <button 
                                onclick={() => removeLanguage(index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
                        {#if languageErrors[index].length > 0}
                            <ul class="text-red-500 text-xs mt-1">
                                {#each languageErrors[index] as error}
                                    <li>• {error}</li>
                                {/each}
                            </ul>
                        {/if}
                    {/each}
                </div>
            </div>
            
            <!-- Software -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-medium text-gray-800">Software & Tools</h4>
                    <button 
                        onclick={() => addSkill('software')}
                        class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                        + Add Software
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {#each $cvFormStore.skills.software as software, index}
                        <div class="flex gap-2">
                            <input 
                                bind:value={$cvFormStore.skills.software[index]}
                                type="text" 
                                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Python, R, MATLAB, etc."
                            >
                            <button 
                                onclick={() => removeSkill('software', index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
                        {#if skillErrors.software[index]}
                            <p class="text-red-500 text-xs mt-1">{skillErrors.software[index]}</p>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- Awards -->
    {#if currentSection === 'awards'}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">🏆 Awards & Honors</h3>
                <button 
                    onclick={addAward}
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Add Award
                </button>
            </div>
            
            {#each $cvFormStore.awards as award, index}
                <div class="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900">Award #{index + 1}</h4>
                        <button 
                            onclick={() => removeAward(index)}
                            class="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Award Title *</label>
                            <input 
                                bind:value={award.title}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Excellence in Research Award"
                            >
                            {#if awardErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each awardErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                            <input 
                                bind:value={award.organization}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="National Science Foundation"
                            >
                            {#if awardErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each awardErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input 
                                bind:value={award.year}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2023"
                            >
                            {#if awardErrors[index].length > 0}
                                <ul class="text-red-500 text-xs mt-1">
                                    {#each awardErrors[index] as error}
                                        <li>• {error}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                        <textarea 
                            bind:value={award.description}
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows="2"
                            placeholder="Brief description of the award and its significance"
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            {#if $cvFormStore.awards.length === 0}
                <div class="text-center py-8 text-gray-500">
                    No awards yet. Click "Add Award" to get started.
                </div>
            {/if}
        </div>
    {/if}

    <!-- Optional Sections -->
    {#if currentSection === 'optional'}
        <div class="space-y-8">
            <h3 class="text-xl font-bold text-gray-900">📋 Optional Sections</h3>
            <p class="text-gray-600">Add additional sections that are relevant to your field and career stage.</p>
            
            <!-- This is a simplified version - in production you'd want full CRUD for each optional section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="font-medium text-blue-900 mb-3">📈 Conferences & Presentations</h4>
                    <p class="text-sm text-blue-700 mb-4">Conference talks, poster sessions, invited presentations</p>
                    <div class="space-y-3">
                        <input 
                            type="text" 
                            class="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Presentation title"
                        >
                        <input 
                            type="text" 
                            class="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Conference name, location, year"
                        >
                    </div>
                </div>
                
                <div class="bg-green-50 rounded-lg p-6">
                    <h4 class="font-medium text-green-900 mb-3">💰 Grants & Funding</h4>
                    <p class="text-sm text-green-700 mb-4">Research grants, fellowships, funding received</p>
                    <div class="space-y-3">
                        <input 
                            type="text" 
                            class="w-full border border-green-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Grant title"
                        >
                        <input 
                            type="text" 
                            class="w-full border border-green-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Funding agency, amount, year"
                        >
                    </div>
                </div>
                
                <div class="bg-purple-50 rounded-lg p-6">
                    <h4 class="font-medium text-purple-900 mb-3">🏫 Teaching Experience</h4>
                    <p class="text-sm text-purple-700 mb-4">Courses taught, guest lectures, mentoring</p>
                    <div class="space-y-3">
                        <input 
                            type="text" 
                            class="w-full border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Course name and role"
                        >
                        <input 
                            type="text" 
                            class="w-full border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Institution, semester, year"
                        >
                    </div>
                </div>
                
                <div class="bg-orange-50 rounded-lg p-6">
                    <h4 class="font-medium text-orange-900 mb-3">🤝 Professional Service</h4>
                    <p class="text-sm text-orange-700 mb-4">Editorial boards, peer review, committee work</p>
                    <div class="space-y-3">
                        <input 
                            type="text" 
                            class="w-full border border-orange-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Service role"
                        >
                        <input 
                            type="text" 
                            class="w-full border border-orange-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Organization, duration"
                        >
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-6">
                <h4 class="font-medium text-gray-900 mb-3">💡 Pro Tip</h4>
                <p class="text-sm text-gray-700">
                    The optional sections shown here are simplified for this demo. In the generated CV, 
                    we'll include the most relevant sections based on your academic field and the information 
                    you've provided in the main sections.
                </p>
            </div>
        </div>
    {/if}

    <!-- Navigation Buttons: Always visible at the bottom of the form -->
    <div class="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t gap-4">
        <button onclick={prevSection} class="btn btn-secondary w-full sm:w-auto" disabled={currentSectionIndex === 0}>Previous</button>
        {#if currentSectionIndex < sections.length - 1}
            <button onclick={nextSection} disabled={!isCurrentSectionValid()} class="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        {:else}
            <button onclick={handleGenerate} class="btn btn-primary bg-green-600 hover:bg-green-700 w-full sm:w-auto">Generate Academic CV</button>
        {/if}
    </div>

    {#if showValidationModal}
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
                <h2 class="text-xl font-bold text-red-600 mb-4">Please fill in the required details</h2>
                <ul class="mb-4 text-left text-red-500">
                    {#each missingFields as field}
                        <li>• {field}</li>
                    {/each}
                </ul>
                <button onclick={closeValidationModal} class="btn btn-primary w-full">OK</button>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Custom scrollbar for better UX */
    textarea::-webkit-scrollbar {
        width: 8px;
    }
    
    textarea::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    textarea::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    textarea::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
</style> 