<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import { getFeatureLimit, hasFeatureAccess } from '$lib/stripe';
	import type { PageData } from '../$types';
	import AdSenseAd from '$lib/components/AdSenseAd.svelte';

	export let data: PageData;
	let { supabase, session } = data;

	let formData = {
		professorName: '',
		professorTitle: 'Professor',
		university: '',
		department: '',
		professorResearch: '',
		studentResearch: '',
		studentName: '',
		studentProgram: '',
		emailTone: 'professional',
		additionalInfo: ''
	};

	let generatedEmail = '';
	let generating = false;
	let errorMessage = '';
	let userPlan = 'free';
	let canUseGenerator = false;
	let usageLimit = 0;
	let generatedSubject = '';
	let generatedBody = '';

	onMount(async () => {
		// ... logic to determine userPlan and canUseGenerator
	});

	async function generateEmail(event: Event) {
		event.preventDefault();
		// Remove the canUseGenerator check. Always allow submission.

		// Validation
		const required = [
			'professorName',
			'university',
			'department',
			'professorResearch',
			'studentResearch',
			'studentName',
			'studentProgram'
		];
		for (const field of required) {
			if (!(formData as any)[field].trim()) {
				alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
				return;
			}
		}

		generating = true;
		errorMessage = '';
		generatedEmail = '';
		generatedSubject = '';
		generatedBody = '';

		try {
			const response = await fetch('/api/generate-cold-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			const data = await response.json();
			if (!response.ok) {
				// Show backend error message
				errorMessage = data.message || data.error || 'Failed to generate email';
				return;
			}

			// Accept { subject, body } format
			if (data.subject && data.body) {
				generatedSubject = data.subject;
				generatedBody = data.body;
				generatedEmail = '';
			} else if (data.email) {
				generatedEmail = data.email;
				generatedSubject = '';
				generatedBody = '';
			} else {
				generatedEmail = 'Email generated, but format was unexpected.';
				generatedSubject = '';
				generatedBody = '';
			}
		} catch (err: any) {
			errorMessage = err.message;
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Cold Email Generator</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <!-- Hero/Header Section -->
    <section class="pt-30 pb-12 bg-gradient-to-r from-[#2C3580] to-[#3c4d9c]">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <span class="text-5xl">✉️</span>
                Cold Email Generator
            </h1>
            <p class="text-xl md:text-2xl text-blue-100 mb-6 max-w-2xl mx-auto">
                Craft a professional cold email to a professor for research opportunities. Free users get 5 emails/month. Upgrade for more.
            </p>
        </div>
    </section>

    <!-- Main Content Section -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16">
        <div class="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100 animate-fade-in">
            <form on:submit={generateEmail} class="space-y-8">
                <!-- About You -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-2xl">🧑‍🎓</span>
                        <h2 class="text-lg font-semibold text-blue-700">About You</h2>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="floating-label-group">
                            <input type="text" id="studentName" bind:value={formData.studentName} class="floating-input" required />
                            <label for="studentName">Your Full Name</label>
                        </div>
                        <div class="floating-label-group">
                            <input type="text" id="studentProgram" bind:value={formData.studentProgram} class="floating-input" required />
                            <label for="studentProgram">Your Program (e.g., MSc in Computer Science)</label>
                        </div>
                    </div>
                </div>
                <!-- About Professor -->
                <div>
                    <div class="flex items-center gap-2 mb-4 mt-8">
                        <span class="text-2xl">👨‍🏫</span>
                        <h2 class="text-lg font-semibold text-blue-700">About the Professor</h2>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="floating-label-group">
                            <input type="text" id="professorName" bind:value={formData.professorName} class="floating-input" required />
                            <label for="professorName">Professor's Full Name</label>
                        </div>
                        <div class="floating-label-group">
                            <select id="professorTitle" bind:value={formData.professorTitle} class="floating-input">
                                <option>Professor</option>
                                <option>Associate Professor</option>
                                <option>Assistant Professor</option>
                                <option>Dr.</option>
                            </select>
                            <label for="professorTitle">Professor's Title</label>
                        </div>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6 mt-6">
                        <div class="floating-label-group">
                            <input type="text" id="university" bind:value={formData.university} class="floating-input" required />
                            <label for="university">University</label>
                        </div>
                        <div class="floating-label-group">
                            <input type="text" id="department" bind:value={formData.department} class="floating-input" required />
                            <label for="department">Department</label>
                        </div>
                    </div>
                </div>
                <!-- Research Alignment -->
                <div>
                    <div class="flex items-center gap-2 mb-4 mt-8">
                        <span class="text-2xl">🔬</span>
                        <h2 class="text-lg font-semibold text-blue-700">Research Alignment</h2>
                    </div>
                    <div class="floating-label-group mb-6">
                        <textarea id="professorResearch" rows="3" bind:value={formData.professorResearch} class="floating-input" required></textarea>
                        <label for="professorResearch">Professor's Research Interests (copy-paste from their profile)</label>
                    </div>
                    <div class="floating-label-group mb-6">
                        <textarea id="studentResearch" rows="3" bind:value={formData.studentResearch} class="floating-input" required placeholder="Briefly explain how your skills and research interests connect with the professor's work."></textarea>
                        <label for="studentResearch">How Your Research Aligns</label>
                    </div>
                </div>
                <!-- Email Tone & Additional Info -->
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="floating-label-group">
                        <select id="emailTone" bind:value={formData.emailTone} class="floating-input">
                            <option value="professional">Professional</option>
                            <option value="enthusiastic">Enthusiastic</option>
                            <option value="formal">Formal</option>
                        </select>
                        <label for="emailTone">Email Tone</label>
                    </div>
                    <div class="floating-label-group">
                        <textarea id="additionalInfo" rows="2" bind:value={formData.additionalInfo} class="floating-input" placeholder="Mention a specific paper of theirs you admire, or a technique you are proficient in."></textarea>
                        <label for="additionalInfo">Additional Information (Optional)</label>
                    </div>
                </div>
                <div class="mt-8">
                    <button type="submit" class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg text-lg shadow-md hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200">
                        {generating ? 'Generating...' : 'Generate Email'}
                    </button>
                </div>
            </form>

            {#if errorMessage}
                <div class="mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg animate-fade-in">
                    <p>{errorMessage}</p>
                </div>
            {/if}

            {#if generatedSubject && generatedBody}
                <div class="mt-10 animate-fade-in">
                    <h2 class="text-2xl font-bold mb-4">Generated Email</h2>
                    <div class="p-6 bg-gray-50 rounded-lg border">
                        <div class="font-semibold mb-2">Subject: {generatedSubject}</div>
                        <div class="prose max-w-none whitespace-pre-line">{generatedBody}</div>
                    </div>
                    <button
                        on:click={() => navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedBody}`)}
                        class="mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                    >
                        Copy to Clipboard
                    </button>
                </div>
            {:else if generatedEmail}
                <div class="mt-10 animate-fade-in">
                    <h2 class="text-2xl font-bold mb-4">Generated Email</h2>
                    <div class="p-6 bg-gray-50 rounded-lg border">
                        <pre class="whitespace-pre-wrap font-sans">{generatedEmail}</pre>
                    </div>
                    <button
                        on:click={() => navigator.clipboard.writeText(generatedEmail)}
                        class="mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                    >
                        Copy to Clipboard
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Ad placement before Footer CTA -->
    <div class="my-10 max-w-4xl mx-auto">
        <AdSenseAd adSlot="8877167254" className="bg-gray-50 p-4 rounded-lg border" variant="in-article" />
    </div>

    <!-- Footer CTA Card -->
    <div class="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
        <h3 class="text-2xl font-bold mb-4">Ready to Complete Your Application Suite?</h3>
        <p class="text-blue-100 mb-6">
            Use our full suite of AI-powered tools to create compelling application documents and maximize your chances of success.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/sop" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
                📝 Statement of Purpose
            </a>
            <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
                💰 Find Scholarships
            </a>
            <a href="/academic-cv" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
                📄 Academic CV
            </a>
            <a href="/dashboard" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
                📊 Dashboard
            </a>
        </div>
    </div>
</div>

<style>
.bg-gradient-to-r {
    background: linear-gradient(to right, #2C3580, #3c4d9c);
}
.animate-fade-in {
    animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: none; }
}
.floating-label-group {
    position: relative;
    margin-bottom: 1.5rem;
}
.floating-input {
    width: 100%;
    padding: 1.5rem 1rem 0.5rem 1rem;
    border: 1.5px solid #cbd5e1;
    border-radius: 0.75rem;
    background: #f8fafc;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
}
.floating-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #2563eb22;
    background: #fff;
}
.floating-label-group label {
    position: absolute;
    left: 1rem;
    top: 0.7rem;
    color: #64748b;
    font-size: 1rem;
    pointer-events: none;
    background: transparent;
    transition: all 0.2s;
    padding: 0 0.25rem;
    z-index: 2;
    background: #f8fafc;
}
.floating-input:focus + label,
.floating-input:not(:placeholder-shown):not(:focus):not([value=""]) + label,
.floating-input:not(:placeholder-shown):focus + label,
.floating-input:valid + label {
    top: -0.9rem;
    left: 0.75rem;
    font-size: 0.85rem;
    color: #2563eb;
    background: #fff;
    padding: 0 0.25rem;
    z-index: 3;
}
select.floating-input {
    padding-top: 1.5rem;
    padding-bottom: 0.5rem;
}
textarea.floating-input {
    min-height: 3.5rem;
    resize: vertical;
}
</style> 