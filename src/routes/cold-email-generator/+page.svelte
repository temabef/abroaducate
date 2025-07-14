<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import { getFeatureLimit, hasFeatureAccess } from '$lib/stripe';
	import type { PageData } from '../$types';

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

	onMount(async () => {
		// ... logic to determine userPlan and canUseGenerator
	});

	async function generateEmail(event: Event) {
		event.preventDefault();
		if (!canUseGenerator) {
			errorMessage = 'Upgrade to access the Cold Email Generator.';
			return;
		}

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

		try {
			const response = await fetch('/api/generate-cold-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to generate email');
			}

			const data = await response.json();
			generatedEmail = data.email;
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

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-4">Cold Email Generator for Professors</h1>
	<p class="mb-6">
		Craft a professional email to a professor for research opportunities. This tool is available for
		Professional and Elite plan subscribers.
	</p>

	{#if !canUseGenerator}
		<div class="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
			<p>
				Please <a href="/pricing" class="font-bold underline">upgrade your plan</a> to use this
				feature.
			</p>
		</div>
	{:else}
		<form on:submit={generateEmail} class="space-y-6">
			<!-- Form fields -->
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<label for="studentName" class="block text-sm font-medium text-gray-700"
						>Your Full Name</label
					>
					<input
						type="text"
						id="studentName"
						bind:value={formData.studentName}
						class="mt-1 block w-full"
						required
					/>
				</div>
				<div>
					<label for="studentProgram" class="block text-sm font-medium text-gray-700"
						>Your Program (e.g., MSc in Computer Science)</label
					>
					<input
						type="text"
						id="studentProgram"
						bind:value={formData.studentProgram}
						class="mt-1 block w-full"
						required
					/>
				</div>
			</div>
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<label for="professorName" class="block text-sm font-medium text-gray-700"
						>Professor's Full Name</label
					>
					<input
						type="text"
						id="professorName"
						bind:value={formData.professorName}
						class="mt-1 block w-full"
						required
					/>
				</div>
				<div>
					<label for="professorTitle" class="block text-sm font-medium text-gray-700"
						>Professor's Title</label
					>
					<select bind:value={formData.professorTitle} class="mt-1 block w-full">
						<option>Professor</option>
						<option>Associate Professor</option>
						<option>Assistant Professor</option>
						<option>Dr.</option>
					</select>
				</div>
			</div>
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<label for="university" class="block text-sm font-medium text-gray-700"
						>University</label
					>
					<input
						type="text"
						id="university"
						bind:value={formData.university}
						class="mt-1 block w-full"
						required
					/>
				</div>
				<div>
					<label for="department" class="block text-sm font-medium text-gray-700"
						>Department</label
					>
					<input
						type="text"
						id="department"
						bind:value={formData.department}
						class="mt-1 block w-full"
						required
					/>
				</div>
			</div>
			<div>
				<label for="professorResearch" class="block text-sm font-medium text-gray-700"
					>Professor's Research Interests (copy-paste from their profile)</label
				>
				<textarea
					id="professorResearch"
					rows="4"
					bind:value={formData.professorResearch}
					class="mt-1 block w-full"
					required
				></textarea>
			</div>
			<div>
				<label for="studentResearch" class="block text-sm font-medium text-gray-700"
					>How Your Research Aligns</label
				>
				<textarea
					id="studentResearch"
					rows="4"
					bind:value={formData.studentResearch}
					class="mt-1 block w-full"
					required
					placeholder="Briefly explain how your skills and research interests connect with the professor's work."
				></textarea>
			</div>
			<div>
				<label for="emailTone" class="block text-sm font-medium text-gray-700"
					>Email Tone</label
				>
				<select bind:value={formData.emailTone} class="mt-1 block w-full">
					<option value="professional">Professional</option>
					<option value="enthusiastic">Enthusiastic</option>
					<option value="formal">Formal</option>
				</select>
			</div>
			<div>
				<label for="additionalInfo" class="block text-sm font-medium text-gray-700"
					>Additional Information (Optional)</label
				>
				<textarea
					id="additionalInfo"
					rows="3"
					bind:value={formData.additionalInfo}
					class="mt-1 block w-full"
					placeholder="Mention a specific paper of theirs you admire, or a technique you are proficient in."
				></textarea>
			</div>
			<div>
				<button
					type="submit"
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
					disabled={generating}
				>
					{generating ? 'Generating...' : 'Generate Email'}
				</button>
			</div>
		</form>
	{/if}

	{#if errorMessage}
		<div class="mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
			<p>{errorMessage}</p>
		</div>
	{/if}

	{#if generatedEmail}
		<div class="mt-8">
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