<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { handleUpgradeRequired } from '$lib/services/upgradeService';
    
    export let existingUserData: any = null;
    
    const dispatch = createEventDispatcher();
    
    interface CVData {
        template: 'stem' | 'humanities' | 'social_sciences' | 'business' | 'medical' | 'arts';
        personalInfo: {
            fullName: string;
            email: string;
            phone: string;
            address: string;
            website?: string;
            linkedin?: string;
            orcid?: string;
        };
        education: Array<{
            degree: string;
            institution: string;
            year: string;
            gpa?: string;
            thesis?: string;
            advisor?: string;
        }>;
        research: Array<{
            title: string;
            institution: string;
            supervisor: string;
            duration: string;
            description: string;
        }>;
        publications: Array<{
            type: 'journal' | 'conference' | 'book' | 'chapter' | 'preprint';
            citation: string;
            year: string;
        }>;
        experience: Array<{
            type: 'teaching' | 'industry' | 'volunteer' | 'internship';
            title: string;
            organization: string;
            duration: string;
            description: string;
        }>;
        awards: Array<{
            title: string;
            organization: string;
            year: string;
            amount?: string;
        }>;
        skills: {
            technical: string[];
            languages: string[];
            software: string[];
        };
        customRequests?: string;
    }
    
    let generating = false;
    let currentStep = 1;
    let totalSteps = 6;
    let generatedCV = '';
    
    // No longer needed - using global upgrade system
    
    let cvData: CVData = {
        template: 'stem',
        personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            address: ''
        },
        education: [{
            degree: '',
            institution: '',
            year: ''
        }],
        research: [],
        publications: [],
        experience: [],
        awards: [],
        skills: {
            technical: [],
            languages: [],
            software: []
        }
    };
    
    // CV Templates
    const cvTemplates = [
        {
            value: 'stem',
            label: '🔬 STEM Fields',
            description: 'Science, Technology, Engineering, Mathematics',
            color: 'from-blue-600 to-cyan-700',
            sections: ['Education', 'Research', 'Publications', 'Technical Skills', 'Awards']
        },
        {
            value: 'humanities',
            label: '📚 Humanities',
            description: 'Literature, History, Philosophy, Languages',
            color: 'from-purple-600 to-violet-700',
            sections: ['Education', 'Teaching', 'Publications', 'Conferences', 'Languages']
        },
        {
            value: 'social_sciences',
            label: '🌍 Social Sciences',
            description: 'Psychology, Sociology, Anthropology, Political Science',
            color: 'from-green-600 to-emerald-700',
            sections: ['Education', 'Research', 'Teaching', 'Publications', 'Field Work']
        },
        {
            value: 'business',
            label: '💼 Business & Economics',
            description: 'Business Administration, Economics, Finance',
            color: 'from-yellow-600 to-orange-700',
            sections: ['Education', 'Experience', 'Research', 'Publications', 'Certifications']
        },
        {
            value: 'medical',
            label: '⚕️ Medical & Health',
            description: 'Medicine, Nursing, Public Health, Biomedical Sciences',
            color: 'from-red-600 to-pink-700',
            sections: ['Education', 'Clinical Experience', 'Research', 'Publications', 'Certifications']
        },
        {
            value: 'arts',
            label: '🎨 Arts & Creative',
            description: 'Fine Arts, Design, Music, Creative Writing',
            color: 'from-indigo-600 to-purple-700',
            sections: ['Education', 'Exhibitions', 'Awards', 'Teaching', 'Portfolio']
        }
    ];
    
    // Pre-populate from existing data
    if (existingUserData) {
        cvData.personalInfo.fullName = existingUserData.name || '';
        cvData.personalInfo.email = existingUserData.email || '';
    }
    
    function nextStep() {
        if (currentStep < totalSteps) {
            currentStep++;
        }
    }
    
    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
    
    function addEducation() {
        cvData.education = [...cvData.education, {
            degree: '',
            institution: '',
            year: ''
        }];
    }
    
    function removeEducation(index: number) {
        cvData.education = cvData.education.filter((_, i) => i !== index);
    }
    
    function addResearch() {
        cvData.research = [...cvData.research, {
            title: '',
            institution: '',
            supervisor: '',
            duration: '',
            description: ''
        }];
    }
    
    function removeResearch(index: number) {
        cvData.research = cvData.research.filter((_, i) => i !== index);
    }
    
    function addPublication() {
        cvData.publications = [...cvData.publications, {
            type: 'journal',
            citation: '',
            year: ''
        }];
    }
    
    function removePublication(index: number) {
        cvData.publications = cvData.publications.filter((_, i) => i !== index);
    }
    
    function addExperience() {
        cvData.experience = [...cvData.experience, {
            type: 'teaching',
            title: '',
            organization: '',
            duration: '',
            description: ''
        }];
    }
    
    function removeExperience(index: number) {
        cvData.experience = cvData.experience.filter((_, i) => i !== index);
    }
    
    function addAward() {
        cvData.awards = [...cvData.awards, {
            title: '',
            organization: '',
            year: ''
        }];
    }
    
    function removeAward(index: number) {
        cvData.awards = cvData.awards.filter((_, i) => i !== index);
    }
    
    function addSkill(category: 'technical' | 'languages' | 'software', skill: string) {
        if (skill.trim()) {
            cvData.skills[category] = [...cvData.skills[category], skill.trim()];
        }
    }
    
    function removeSkill(category: 'technical' | 'languages' | 'software', index: number) {
        cvData.skills[category] = cvData.skills[category].filter((_, i) => i !== index);
    }
    
    async function generateAcademicCV() {
        generating = true;
        
        try {
            const response = await fetch('/api/generate-academic-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cvData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                
                // Handle usage limit exceeded - use the new global system!
                if (response.status === 403 && errorData.upgradeRequired) {
                    handleUpgradeRequired({
                        ...errorData,
                        usageType: 'academic_cvs_created'
                    });
                    return;
                }
                
                throw new Error(errorData.error || 'Failed to generate academic CV');
            }
            
            const data = await response.json();
            generatedCV = data.cv;
            currentStep = totalSteps + 1; // Move to results step
            
        } catch (error) {
            console.error('Error generating academic CV:', error);
            alert('Failed to generate academic CV. Please try again.');
        } finally {
            generating = false;
        }
    }
    
    function startOver() {
        currentStep = 1;
        generatedCV = '';
        cvData = {
            template: 'stem',
            personalInfo: {
                fullName: cvData.personalInfo.fullName,
                email: cvData.personalInfo.email,
                phone: '',
                address: ''
            },
            education: [{ degree: '', institution: '', year: '' }],
            research: [],
            publications: [],
            experience: [],
            awards: [],
            skills: { technical: [], languages: [], software: [] }
        };
    }
    
    async function copyCV() {
        try {
            await navigator.clipboard.writeText(generatedCV);
            alert('Academic CV copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy. Please select and copy manually.');
        }
    }

    async function exportToPDF() {
        try {
            const response = await fetch('/api/export-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: generatedCV,
                    title: `${cvData.personalInfo.fullName}_Academic_CV`,
                    type: 'cv'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${cvData.personalInfo.fullName}_Academic_CV.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Failed to export PDF');
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    }

    async function exportToWord() {
        try {
            const response = await fetch('/api/export-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: generatedCV,
                    title: `${cvData.personalInfo.fullName} - Academic CV`,
                    type: 'cv',
                    metadata: {
                        author: cvData.personalInfo.fullName,
                        institution: cvData.template.replace('_', ' ').toUpperCase() + ' Field',
                        date: new Date().toLocaleDateString()
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${cvData.personalInfo.fullName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Academic_CV.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                alert('✅ Academic CV exported successfully! Your true DOCX file is ready for editing in Microsoft Word.');
            } else {
                throw new Error('Failed to export Word document');
            }
        } catch (error) {
            console.error('Error exporting Word:', error);
            alert('Failed to export Word document. Please try again.');
        }
    }
    
    function getStepTitle(step: number): string {
        const titles = {
            1: 'Template & Personal Info',
            2: 'Education',
            3: 'Research & Publications',
            4: 'Experience & Teaching',
            5: 'Awards & Skills',
            6: 'Review & Generate'
        };
        return titles[step as keyof typeof titles] || 'Complete';
    }
    
    // Upgrade handling now done by global system
</script>

<div class="academic-cv-builder">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold mb-2">📄 Academic CV Builder</h2>
        <p class="opacity-90">Create a professional academic CV tailored to your field and career stage</p>
        
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
            <!-- Step 1: Template & Personal Info -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Choose Your Academic Field Template</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {#each cvTemplates as template}
                        <label class={`relative overflow-hidden rounded-lg border-3 cursor-pointer transition-all ${
                            cvData.template === template.value 
                                ? 'border-indigo-600 ring-4 ring-indigo-300 shadow-lg transform scale-105' 
                                : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                        }`}>
                            <input 
                                type="radio" 
                                bind:group={cvData.template} 
                                value={template.value}
                                class="sr-only"
                            />
                            <div class={`bg-gradient-to-r ${template.color} p-4 text-white`}>
                                <div class="font-bold text-lg">{template.label}</div>
                                <div class="text-sm opacity-90">{template.description}</div>
                            </div>
                            <div class="p-3 bg-gray-50">
                                <div class="text-xs text-gray-600">
                                    <strong>Key Sections:</strong> {template.sections.slice(0, 3).join(', ')}
                                </div>
                            </div>
                        </label>
                    {/each}
                </div>
                
                <!-- Personal Information -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="cv-full-name" class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input 
                                id="cv-full-name"
                                type="text" 
                                bind:value={cvData.personalInfo.fullName}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Dr. Jane Smith"
                                required
                            />
                        </div>
                        <div>
                            <label for="cv-email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input 
                                id="cv-email"
                                type="email" 
                                bind:value={cvData.personalInfo.email}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="jane.smith@university.edu"
                                required
                            />
                        </div>
                        <div>
                            <label for="cv-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input 
                                id="cv-phone"
                                type="tel" 
                                bind:value={cvData.personalInfo.phone}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div>
                            <label for="cv-website" class="block text-sm font-medium text-gray-700 mb-1">Website/Portfolio</label>
                            <input 
                                id="cv-website"
                                type="url" 
                                bind:value={cvData.personalInfo.website}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="https://yourwebsite.com"
                            />
                        </div>
                        <div class="md:col-span-2">
                            <label for="cv-address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input 
                                id="cv-address"
                                type="text" 
                                bind:value={cvData.personalInfo.address}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="123 University Ave, City, State 12345"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 2}
            <!-- Step 2: Education -->
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Education</h3>
                    <button
                        onclick={addEducation}
                        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        + Add Education
                    </button>
                </div>
                
                <div class="space-y-6">
                    {#each cvData.education as education, index}
                        <div class="bg-gray-50 rounded-lg p-4 relative">
                            {#if cvData.education.length > 1}
                                <button
                                    onclick={() => removeEducation(index)}
                                    class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            {/if}
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="degree-{index}" class="block text-sm font-medium text-gray-700 mb-1">Degree/Program *</label>
                                    <input 
                                        id="degree-{index}"
                                        type="text" 
                                        bind:value={education.degree}
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ph.D. in Computer Science"
                                        required
                                    />
                                </div>
                                <div>
                                    <label for="institution-{index}" class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                                    <input 
                                        id="institution-{index}"
                                        type="text" 
                                        bind:value={education.institution}
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Stanford University"
                                        required
                                    />
                                </div>
                                <div>
                                    <label for="year-{index}" class="block text-sm font-medium text-gray-700 mb-1">Year/Expected *</label>
                                    <input 
                                        id="year-{index}"
                                        type="text" 
                                        bind:value={education.year}
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="2024 or Expected 2025"
                                        required
                                    />
                                </div>
                                <div>
                                    <label for="gpa-{index}" class="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
                                    <input 
                                        id="gpa-{index}"
                                        type="text" 
                                        bind:value={education.gpa}
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="3.9/4.0"
                                    />
                                </div>
                                <div class="md:col-span-2">
                                    <label for="thesis-{index}" class="block text-sm font-medium text-gray-700 mb-1">Thesis/Dissertation Title</label>
                                    <input 
                                        id="thesis-{index}"
                                        type="text" 
                                        bind:value={education.thesis}
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Title of your thesis or dissertation"
                                    />
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            
        {:else if currentStep === 3}
            <!-- Step 3: Research & Publications -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Research Experience & Publications</h3>
                
                <!-- Research Experience -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-900">Research Experience</h4>
                        <button
                            onclick={addResearch}
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            + Add Research
                        </button>
                    </div>
                    
                    {#if cvData.research.length === 0}
                        <p class="text-gray-500 text-center py-4">No research experience added yet. Click "Add Research" to get started.</p>
                    {:else}
                        <div class="space-y-4">
                            {#each cvData.research as research, index}
                                <div class="bg-gray-50 rounded-lg p-4 relative">
                                    <button
                                        onclick={() => removeResearch(index)}
                                        class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="md:col-span-2">
                                            <label for="research-title-{index}" class="block text-sm font-medium text-gray-700 mb-1">Research Project Title</label>
                                            <input 
                                                id="research-title-{index}"
                                                type="text" 
                                                bind:value={research.title}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Machine Learning for Medical Diagnosis"
                                            />
                                        </div>
                                        <div>
                                            <label for="research-institution-{index}" class="block text-sm font-medium text-gray-700 mb-1">Institution/Lab</label>
                                            <input 
                                                id="research-institution-{index}"
                                                type="text" 
                                                bind:value={research.institution}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Stanford AI Lab"
                                            />
                                        </div>
                                        <div>
                                            <label for="research-duration-{index}" class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                            <input 
                                                id="research-duration-{index}"
                                                type="text" 
                                                bind:value={research.duration}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Sep 2022 - Present"
                                            />
                                        </div>
                                        <div class="md:col-span-2">
                                            <label for="research-description-{index}" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea 
                                                id="research-description-{index}"
                                                bind:value={research.description}
                                                rows="3"
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Describe your research, methodologies, findings, and contributions..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <!-- Publications -->
                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-900">Publications</h4>
                        <button
                            onclick={addPublication}
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            + Add Publication
                        </button>
                    </div>
                    
                    {#if cvData.publications.length === 0}
                        <p class="text-gray-500 text-center py-4">No publications added yet. Click "Add Publication" to get started.</p>
                    {:else}
                        <div class="space-y-4">
                            {#each cvData.publications as publication, index}
                                <div class="bg-gray-50 rounded-lg p-4 relative">
                                    <button
                                        onclick={() => removePublication(index)}
                                        class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label for="pub-type-{index}" class="block text-sm font-medium text-gray-700 mb-1">Publication Type</label>
                                            <select 
                                                id="pub-type-{index}"
                                                bind:value={publication.type}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="journal">Journal Article</option>
                                                <option value="conference">Conference Paper</option>
                                                <option value="book">Book</option>
                                                <option value="chapter">Book Chapter</option>
                                                <option value="preprint">Preprint</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label for="pub-year-{index}" class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <input 
                                                id="pub-year-{index}"
                                                type="text" 
                                                bind:value={publication.year}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="2024"
                                            />
                                        </div>
                                        <div class="md:col-span-3">
                                            <label for="pub-citation-{index}" class="block text-sm font-medium text-gray-700 mb-1">Full Citation</label>
                                            <textarea 
                                                id="pub-citation-{index}"
                                                bind:value={publication.citation}
                                                rows="2"
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Smith, J., Doe, A. (2024). Title of Paper. Journal Name, 15(3), 123-145."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
            
        {:else if currentStep === 4}
            <!-- Step 4: Experience & Teaching -->
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Professional Experience & Teaching</h3>
                    <button
                        onclick={addExperience}
                        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        + Add Experience
                    </button>
                </div>
                
                {#if cvData.experience.length === 0}
                    <p class="text-gray-500 text-center py-8">No experience added yet. Click "Add Experience" to get started.</p>
                {:else}
                    <div class="space-y-6">
                        {#each cvData.experience as experience, index}
                            <div class="bg-gray-50 rounded-lg p-4 relative">
                                <button
                                    onclick={() => removeExperience(index)}
                                    class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="exp-type-{index}" class="block text-sm font-medium text-gray-700 mb-1">Experience Type</label>
                                        <select 
                                            id="exp-type-{index}"
                                            bind:value={experience.type}
                                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="teaching">Teaching Experience</option>
                                            <option value="industry">Industry Experience</option>
                                            <option value="volunteer">Volunteer Work</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label for="exp-title-{index}" class="block text-sm font-medium text-gray-700 mb-1">Title/Position</label>
                                        <input 
                                            id="exp-title-{index}"
                                            type="text" 
                                            bind:value={experience.title}
                                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Teaching Assistant, Software Engineer, etc."
                                        />
                                    </div>
                                    <div>
                                        <label for="exp-organization-{index}" class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                        <input 
                                            id="exp-organization-{index}"
                                            type="text" 
                                            bind:value={experience.organization}
                                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="University, Company, Organization"
                                        />
                                    </div>
                                    <div>
                                        <label for="exp-duration-{index}" class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                        <input 
                                            id="exp-duration-{index}"
                                            type="text" 
                                            bind:value={experience.duration}
                                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Fall 2023, Jan 2023 - Aug 2023"
                                        />
                                    </div>
                                    <div class="md:col-span-2">
                                        <label for="exp-description-{index}" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            id="exp-description-{index}"
                                            bind:value={experience.description}
                                            rows="3"
                                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Describe your responsibilities, achievements, and impact..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            
        {:else if currentStep === 5}
            <!-- Step 5: Awards & Skills -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Awards, Honors & Skills</h3>
                
                <!-- Awards -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-900">Awards & Honors</h4>
                        <button
                            onclick={addAward}
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            + Add Award
                        </button>
                    </div>
                    
                    {#if cvData.awards.length === 0}
                        <p class="text-gray-500 text-center py-4">No awards added yet. Click "Add Award" to get started.</p>
                    {:else}
                        <div class="space-y-4">
                            {#each cvData.awards as award, index}
                                <div class="bg-gray-50 rounded-lg p-4 relative">
                                    <button
                                        onclick={() => removeAward(index)}
                                        class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label for="award-title-{index}" class="block text-sm font-medium text-gray-700 mb-1">Award Title</label>
                                            <input 
                                                id="award-title-{index}"
                                                type="text" 
                                                bind:value={award.title}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Best Student Paper Award"
                                            />
                                        </div>
                                        <div>
                                            <label for="award-organization-{index}" class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                            <input 
                                                id="award-organization-{index}"
                                                type="text" 
                                                bind:value={award.organization}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="IEEE, NSF, University"
                                            />
                                        </div>
                                        <div>
                                            <label for="award-year-{index}" class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <input 
                                                id="award-year-{index}"
                                                type="text" 
                                                bind:value={award.year}
                                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="2024"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <!-- Skills -->
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Skills & Competencies</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Technical Skills -->
                        <div>
                            <label for="cv-technical-skills" class="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                            <div class="space-y-2">
                                <input 
                                    id="cv-technical-skills"
                                    type="text" 
                                    placeholder="Add technical skill"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter' && e.target && 'value' in e.target) {
                                            const target = e.target as HTMLInputElement;
                                            addSkill('technical', target.value);
                                            target.value = '';
                                        }
                                    }}
                                />
                                <div class="flex flex-wrap gap-2">
                                    {#each cvData.skills.technical as skill, index}
                                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {skill}
                                            <button onclick={() => removeSkill('technical', index)} class="text-blue-600 hover:text-blue-800">✕</button>
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Languages -->
                        <div>
                            <label for="cv-languages" class="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                            <div class="space-y-2">
                                <input 
                                    id="cv-languages"
                                    type="text" 
                                    placeholder="Add language"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter' && e.target && 'value' in e.target) {
                                            const target = e.target as HTMLInputElement;
                                            addSkill('languages', target.value);
                                            target.value = '';
                                        }
                                    }}
                                />
                                <div class="flex flex-wrap gap-2">
                                    {#each cvData.skills.languages as skill, index}
                                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {skill}
                                            <button onclick={() => removeSkill('languages', index)} class="text-green-600 hover:text-green-800">✕</button>
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Software -->
                        <div>
                            <label for="cv-software" class="block text-sm font-medium text-gray-700 mb-2">Software & Tools</label>
                            <div class="space-y-2">
                                <input 
                                    id="cv-software"
                                    type="text" 
                                    placeholder="Add software/tool"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter' && e.target && 'value' in e.target) {
                                            const target = e.target as HTMLInputElement;
                                            addSkill('software', target.value);
                                            target.value = '';
                                        }
                                    }}
                                />
                                <div class="flex flex-wrap gap-2">
                                    {#each cvData.skills.software as skill, index}
                                        <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {skill}
                                            <button onclick={() => removeSkill('software', index)} class="text-purple-600 hover:text-purple-800">✕</button>
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-500 mt-4">Press Enter to add each skill</p>
                </div>
            </div>
            
        {:else if currentStep === totalSteps}
            <!-- Step 6: Review & Generate -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Review & Generate</h3>
                
                <!-- Summary -->
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-gray-900 mb-3">CV Summary</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium">Template:</span> 
                            <span class="capitalize">{cvData.template.replace('_', ' ')}</span>
                        </div>
                        <div>
                            <span class="font-medium">Name:</span> 
                            {cvData.personalInfo.fullName || 'Not specified'}
                        </div>
                        <div>
                            <span class="font-medium">Education Entries:</span> 
                            {cvData.education.filter(e => e.degree && e.institution).length}
                        </div>
                        <div>
                            <span class="font-medium">Research Projects:</span> 
                            {cvData.research.length}
                        </div>
                    </div>
                </div>
                
                <!-- Custom Requests -->
                <div class="mb-6">
                    <label for="cv-custom-requests" class="block text-sm font-medium text-gray-700 mb-1">Additional Instructions (Optional)</label>
                    <textarea 
                        id="cv-custom-requests"
                        bind:value={cvData.customRequests}
                        rows="3"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Specific formatting, emphasis, or style preferences..."
                    ></textarea>
                </div>
                
                <!-- Generate Button -->
                <button
                    onclick={generateAcademicCV}
                    disabled={generating || !cvData.personalInfo.fullName || !cvData.personalInfo.email}
                    class="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {#if generating}
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating Academic CV...
                    {:else}
                        📄 Generate Academic CV
                    {/if}
                </button>
            </div>
            
        {:else}
            <!-- Results -->
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Your Academic CV</h3>
                    <div class="flex gap-2 flex-wrap">
                        <button
                            onclick={copyCV}
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                        >
                            📋 Copy
                        </button>
                        <button
                            onclick={exportToPDF}
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                            📄 PDF
                        </button>
                        <button
                            onclick={exportToWord}
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                        >
                            📝 Word
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="prose max-w-none whitespace-pre-line font-mono text-sm">
                        {generatedCV}
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button
                        onclick={startOver}
                        class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        🔄 Create Another CV
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
                            (currentStep === 1 && (!cvData.personalInfo.fullName || !cvData.personalInfo.email)) ||
                            (currentStep === 2 && !cvData.education.some(e => e.degree && e.institution))
                        }
                        class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

<!-- Upgrade modals now handled globally via GlobalUpgradeHandler in layout -->

<style>
    .academic-cv-builder {
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