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

    function goToSection(index: number) {
        // Only allow going back or to current
        if (index <= currentSectionIndex) {
            currentSectionIndex = index;
        }
    }
    function nextSection() {
        if (currentSectionIndex < sections.length - 1) {
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
        // Add more required fields as needed
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
                on:click={() => goToSection(i)}
                class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors {currentSection === section.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
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
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Dr. Jane Smith"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.email}
                        type="email" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="jane.smith@university.edu"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.phone}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.address}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="City, State, Country"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Website/Portfolio</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.website}
                        type="url" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://www.yoursite.com"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ORCID ID</label>
                    <input 
                        bind:value={$cvFormStore.personalInfo.orcid}
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0000-0000-0000-0000"
                    >
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
            </div>
        </div>
    {/if}

    <!-- Education -->
    {#if currentSection === 'education'}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">🎓 Education</h3>
                <button 
                    on:click={addEducation}
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
                            on:click={() => removeEducation(index)}
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
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                            <input 
                                bind:value={edu.institution}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Stanford University"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input 
                                bind:value={edu.year}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2020 or 2018-2022"
                            >
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
                    on:click={addExperience}
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
                            on:click={() => removeExperience(index)}
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
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Institution/Company *</label>
                            <input 
                                bind:value={exp.institution}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="MIT"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                            <input 
                                bind:value={exp.duration}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2020-Present or Jan 2020 - Dec 2022"
                            >
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
                    on:click={addPublication}
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
                            on:click={() => removePublication(index)}
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
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Authors *</label>
                            <input 
                                bind:value={pub.authors}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Smith, J., Johnson, A., & Brown, C."
                            >
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
                        on:click={() => addSkill('technical')}
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
                                on:click={() => removeSkill('technical', index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
            
            <!-- Languages -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-medium text-gray-800">Languages</h4>
                    <button 
                        on:click={addLanguage}
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
                                on:click={() => removeLanguage(index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
            
            <!-- Software -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-medium text-gray-800">Software & Tools</h4>
                    <button 
                        on:click={() => addSkill('software')}
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
                                on:click={() => removeSkill('software', index)}
                                class="text-red-600 hover:text-red-800 px-2"
                            >
                                ×
                            </button>
                        </div>
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
                    on:click={addAward}
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
                            on:click={() => removeAward(index)}
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
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                            <input 
                                bind:value={award.organization}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="National Science Foundation"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input 
                                bind:value={award.year}
                                type="text" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="2023"
                            >
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
        <button on:click={prevSection} class="btn btn-secondary w-full sm:w-auto" disabled={currentSectionIndex === 0}>Previous</button>
        {#if currentSectionIndex < sections.length - 1}
            <button on:click={nextSection} class="btn btn-primary w-full sm:w-auto">Next</button>
        {:else}
            <button on:click={handleGenerate} class="btn btn-primary bg-green-600 hover:bg-green-700 w-full sm:w-auto">Generate Academic CV</button>
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
                <button on:click={closeValidationModal} class="btn btn-primary w-full">OK</button>
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