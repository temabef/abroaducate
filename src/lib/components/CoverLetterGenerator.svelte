<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { handleUpgradeRequired } from '$lib/services/upgradeService';
    
    export let existingUserData: any = null;
    export let existingSOPData: any = null;
    
    const dispatch = createEventDispatcher();
    
    interface CoverLetterData {
        positionType: 'academic' | 'industry' | 'government' | 'hybrid';
        jobTitle: string;
        companyName: string;
        applicationDeadline?: string;
        jobDescription?: string;
        requirements?: string;
        personalInfo: {
            name: string;
            email: string;
            phone: string;
            address: string;
        };
        positionDetails: {
            // Academic fields
            researchArea?: string;
            publications?: string;
            academicAchievements?: string;
            // Industry fields
            targetRole?: string;
            companyResearch?: string;
            relevantSkills?: string;
            businessImpact?: string;
            // Universal fields
            experience: string;
            achievements: string;
            motivations: string;
            careerGoals: string;
        };
        customRequests?: string;
    }
    
    let generating = false;
    let currentStep = 1;
    let totalSteps = 4;
    let generatedCoverLetter = '';
    let coverLetterData: CoverLetterData = {
        positionType: 'academic',
        jobTitle: '',
        companyName: '',
        personalInfo: {
            name: '',
            email: '',
            phone: '',
            address: ''
        },
        positionDetails: {
            experience: '',
            achievements: '',
            motivations: '',
            careerGoals: ''
        }
    };
    
    // Position type options
    const positionTypes = [
        {
            value: 'academic',
            label: '🎓 Academic Position',
            description: 'PhD, PostDoc, Professor, Research Scientist',
            color: 'from-blue-500 to-purple-600'
        },
        {
            value: 'industry',
            label: '💼 Industry Position', 
            description: 'Corporate, Startup, Consulting, Tech',
            color: 'from-green-500 to-blue-600'
        },
        {
            value: 'government',
            label: '🏛️ Government/NGO',
            description: 'Public sector, Policy, International orgs',
            color: 'from-red-500 to-pink-600'
        },
        {
            value: 'hybrid',
            label: '🔬 Hybrid Role',
            description: 'Industry R&D, Corporate Research, Think Tanks',
            color: 'from-purple-500 to-indigo-600'
        }
    ];
    
    // Pre-populate from existing data
    if (existingUserData) {
        coverLetterData.personalInfo = {
            name: existingUserData.name || '',
            email: existingUserData.email || '',
            phone: existingUserData.phone || '',
            address: existingUserData.address || ''
        };
    }
    
    if (existingSOPData) {
        // Extract relevant information from SOP
        coverLetterData.positionDetails.experience = extractExperienceFromSOP(existingSOPData.content);
        coverLetterData.positionDetails.achievements = extractAchievementsFromSOP(existingSOPData.content);
        coverLetterData.positionDetails.motivations = extractMotivationFromSOP(existingSOPData.content);
    }
    
    function extractExperienceFromSOP(content: string): string {
        // Simple extraction - in real implementation, use more sophisticated NLP
        const sentences = content.split('.').filter(s => s.length > 20);
        const experienceKeywords = ['experience', 'worked', 'project', 'research', 'developed', 'led', 'managed'];
        return sentences.filter(s => 
            experienceKeywords.some(keyword => s.toLowerCase().includes(keyword))
        ).slice(0, 3).join('. ') + '.';
    }
    
    function extractAchievementsFromSOP(content: string): string {
        const sentences = content.split('.').filter(s => s.length > 15);
        const achievementKeywords = ['achieved', 'published', 'awarded', 'recognized', 'successful', 'improved'];
        return sentences.filter(s => 
            achievementKeywords.some(keyword => s.toLowerCase().includes(keyword))
        ).slice(0, 2).join('. ') + '.';
    }
    
    function extractMotivationFromSOP(content: string): string {
        const sentences = content.split('.').filter(s => s.length > 20);
        const motivationKeywords = ['passionate', 'motivated', 'interested', 'driven', 'committed'];
        return sentences.filter(s => 
            motivationKeywords.some(keyword => s.toLowerCase().includes(keyword))
        ).slice(0, 2).join('. ') + '.';
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
    
    async function generateCoverLetter() {
        generating = true;
        
        try {
            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coverLetterData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Server error:', errorData);
                
                // Handle usage limit exceeded
                if (response.status === 403 && errorData.upgradeRequired) {
                    // Use new beautiful upgrade system
                    handleUpgradeRequired(errorData);
                    return;
                }
                
                throw new Error(errorData.details || errorData.error || 'Failed to generate cover letter');
            }
            
            const data = await response.json();
            generatedCoverLetter = data.coverLetter;
            currentStep = totalSteps + 1; // Move to results step
            
        } catch (error) {
            console.error('Error generating cover letter:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter. Please try again.';
            alert(errorMessage);
        } finally {
            generating = false;
        }
    }
    
    function startOver() {
        currentStep = 1;
        generatedCoverLetter = '';
        coverLetterData = {
            positionType: 'academic',
            jobTitle: '',
            companyName: '',
            personalInfo: {
                name: coverLetterData.personalInfo.name,
                email: coverLetterData.personalInfo.email,
                phone: coverLetterData.personalInfo.phone,
                address: coverLetterData.personalInfo.address
            },
            positionDetails: {
                experience: '',
                achievements: '',
                motivations: '',
                careerGoals: ''
            }
        };
    }
    
    async function saveCoverLetter() {
        try {
            console.log('Starting save process...');
            const response = await fetch('/api/save-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...coverLetterData,
                    generatedContent: generatedCoverLetter,
                    wordCount: generatedCoverLetter.split(' ').length
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Save error:', errorData);
                throw new Error(errorData.error || 'Failed to save cover letter');
            }
            
            const result = await response.json();
            console.log('Save result:', result);
            const { coverLetterId } = result;
            
            if (!coverLetterId) {
                throw new Error('No cover letter ID returned from save');
            }
            
            console.log('Redirecting to edit page:', `/cover-letters/${coverLetterId}`);
            
            // Use goto instead of window.location for better SvelteKit handling
            await goto(`/cover-letters/${coverLetterId}`);
            
        } catch (error) {
            console.error('Error saving cover letter:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save cover letter. Please try again.';
            alert(errorMessage);
        }
    }
    
    async function copyCoverLetter() {
        try {
            await navigator.clipboard.writeText(generatedCoverLetter);
            alert('Cover letter copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        }
    }
    
    function getStepTitle(step: number): string {
        const titles = {
            1: 'Position Type & Basic Info',
            2: 'Job Details',
            3: 'Your Background',
            4: 'Review & Generate'
        };
        return titles[step as keyof typeof titles] || 'Complete';
    }
</script>

<div class="cover-letter-generator">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold mb-2">📝 Smart Cover Letter Generator</h2>
        <p class="opacity-90">Create compelling cover letters for academic and industry positions</p>
        
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
            <!-- Step 1: Position Type Selection -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">What type of position are you applying for?</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {#each positionTypes as positionType}
                        <label class={`relative overflow-hidden rounded-lg border-3 cursor-pointer transition-all ${
                            coverLetterData.positionType === positionType.value 
                                ? 'border-blue-600 ring-4 ring-blue-300 shadow-lg transform scale-105' 
                                : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                        }`}>
                            <input 
                                type="radio" 
                                bind:group={coverLetterData.positionType} 
                                value={positionType.value}
                                class="sr-only"
                            />
                            <div class={`bg-gradient-to-r ${positionType.color} p-4 text-white`}>
                                <div class="font-bold text-lg">{positionType.label}</div>
                                <div class="text-sm opacity-90">{positionType.description}</div>
                            </div>
                        </label>
                    {/each}
                </div>
                
                <!-- Personal Information -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="cl-full-name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                id="cl-full-name"
                                type="text" 
                                bind:value={coverLetterData.personalInfo.name}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label for="cl-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                id="cl-email"
                                type="email" 
                                bind:value={coverLetterData.personalInfo.email}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="your.email@example.com"
                            />
                        </div>
                        <div>
                            <label for="cl-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input 
                                id="cl-phone"
                                type="tel" 
                                bind:value={coverLetterData.personalInfo.phone}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your phone number"
                            />
                        </div>
                        <div>
                            <label for="cl-address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input 
                                id="cl-address"
                                type="text" 
                                bind:value={coverLetterData.personalInfo.address}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 2}
            <!-- Step 2: Job Details -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Job Details</h3>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="cl-job-title" class="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                            <input 
                                id="cl-job-title"
                                type="text" 
                                bind:value={coverLetterData.jobTitle}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={coverLetterData.positionType === 'academic' ? 'e.g., PhD in Computer Science' : 'e.g., Senior Software Engineer'}
                            />
                        </div>
                        <div>
                            <label for="cl-company-name" class="block text-sm font-medium text-gray-700 mb-1">
                                {coverLetterData.positionType === 'academic' ? 'Institution/University' : 'Company Name'}
                            </label>
                            <input 
                                id="cl-company-name"
                                type="text" 
                                bind:value={coverLetterData.companyName}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={coverLetterData.positionType === 'academic' ? 'e.g., Stanford University' : 'e.g., Google Inc.'}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label for="cl-deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline (Optional)</label>
                        <input 
                            id="cl-deadline"
                            type="date" 
                            bind:value={coverLetterData.applicationDeadline}
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label for="cl-job-description" class="block text-sm font-medium text-gray-700 mb-1">Job Description/Requirements</label>
                        <textarea 
                            id="cl-job-description"
                            bind:value={coverLetterData.jobDescription}
                            rows="4"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Paste the job description or key requirements here..."
                        ></textarea>
                    </div>
                    
                    <!-- Position-specific fields -->
                    {#if coverLetterData.positionType === 'academic'}
                        <div>
                            <label for="cl-research-area" class="block text-sm font-medium text-gray-700 mb-1">Research Area/Specialization</label>
                            <input 
                                id="cl-research-area"
                                type="text" 
                                bind:value={coverLetterData.positionDetails.researchArea}
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Machine Learning, Computational Biology"
                            />
                        </div>
                    {:else if coverLetterData.positionType === 'industry'}
                        <div>
                            <label for="cl-company-research" class="block text-sm font-medium text-gray-700 mb-1">Company Research</label>
                            <textarea 
                                id="cl-company-research"
                                bind:value={coverLetterData.positionDetails.companyResearch}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="What do you know about this company? Recent achievements, culture, values..."
                            ></textarea>
                        </div>
                    {/if}
                </div>
            </div>
            
        {:else if currentStep === 3}
            <!-- Step 3: Your Background -->
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Your Background & Experience</h3>
                
                <div class="space-y-4">
                    <div>
                        <label for="cl-experience" class="block text-sm font-medium text-gray-700 mb-1">Relevant Experience</label>
                        <textarea 
                            id="cl-experience"
                            bind:value={coverLetterData.positionDetails.experience}
                            rows="4"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe your relevant work experience, research projects, internships..."
                        ></textarea>
                        {#if existingSOPData}
                            <p class="text-xs text-gray-500 mt-1">✨ Pre-filled from your SOP. Feel free to edit.</p>
                        {/if}
                    </div>
                    
                    <div>
                        <label for="cl-achievements" class="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                        <textarea 
                            id="cl-achievements"
                            bind:value={coverLetterData.positionDetails.achievements}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Highlight your key accomplishments, awards, publications, projects..."
                        ></textarea>
                    </div>
                    
                    <!-- Position-specific fields -->
                    {#if coverLetterData.positionType === 'academic'}
                        <div>
                            <label for="cl-publications" class="block text-sm font-medium text-gray-700 mb-1">Publications & Academic Work</label>
                            <textarea 
                                id="cl-publications"
                                bind:value={coverLetterData.positionDetails.publications}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="List your publications, conferences, academic contributions..."
                            ></textarea>
                        </div>
                    {:else if coverLetterData.positionType === 'industry'}
                        <div>
                            <label for="cl-business-impact" class="block text-sm font-medium text-gray-700 mb-1">Business Impact & Skills</label>
                            <textarea 
                                id="cl-business-impact"
                                bind:value={coverLetterData.positionDetails.businessImpact}
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Quantify your impact: increased efficiency by X%, led teams of Y people..."
                            ></textarea>
                        </div>
                    {/if}
                    
                    <div>
                        <label for="cl-motivations" class="block text-sm font-medium text-gray-700 mb-1">Motivation & Interest</label>
                        <textarea 
                            id="cl-motivations"
                            bind:value={coverLetterData.positionDetails.motivations}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Why are you interested in this position? What motivates you?"
                        ></textarea>
                    </div>
                    
                    <div>
                        <label for="cl-career-goals" class="block text-sm font-medium text-gray-700 mb-1">Career Goals</label>
                        <textarea 
                            id="cl-career-goals"
                            bind:value={coverLetterData.positionDetails.careerGoals}
                            rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="What are your short-term and long-term career objectives?"
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
                            <span class="font-medium">Position Type:</span> 
                            <span class="capitalize">{coverLetterData.positionType}</span>
                        </div>
                        <div>
                            <span class="font-medium">Job Title:</span> 
                            {coverLetterData.jobTitle || 'Not specified'}
                        </div>
                        <div>
                            <span class="font-medium">Company:</span> 
                            {coverLetterData.companyName || 'Not specified'}
                        </div>
                        <div>
                            <span class="font-medium">Applicant:</span> 
                            {coverLetterData.personalInfo.name || 'Not specified'}
                        </div>
                    </div>
                </div>
                
                <!-- Custom Requests -->
                <div class="mb-6">
                    <label for="cl-custom-requests" class="block text-sm font-medium text-gray-700 mb-1">Additional Instructions (Optional)</label>
                    <textarea 
                        id="cl-custom-requests"
                        bind:value={coverLetterData.customRequests}
                        rows="3"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any specific tone, style, or content requests for your cover letter..."
                    ></textarea>
                </div>
                
                <!-- Generate Button -->
                <button
                    onclick={generateCoverLetter}
                    disabled={generating || !coverLetterData.jobTitle || !coverLetterData.companyName}
                    class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {#if generating}
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating Your Cover Letter...
                    {:else}
                        ✨ Generate Cover Letter
                    {/if}
                </button>
            </div>
            
        {:else}
            <!-- Results -->
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">Your Cover Letter</h3>
                    <div class="flex gap-2">
                        <button
                            onclick={copyCoverLetter}
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            📋 Copy to Clipboard
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <div class="prose max-w-none">
                        {#each generatedCoverLetter.split('\n') as paragraph}
                            {#if paragraph.trim()}
                                <p class="mb-4">{paragraph}</p>
                            {/if}
                        {/each}
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button
                        onclick={saveCoverLetter}
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        💾 Save & Edit
                    </button>
                    <button
                        onclick={startOver}
                        class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        🔄 Create Another Cover Letter
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
                            (currentStep === 1 && !coverLetterData.positionType) ||
                            (currentStep === 2 && (!coverLetterData.jobTitle || !coverLetterData.companyName))
                        }
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    .cover-letter-generator {
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