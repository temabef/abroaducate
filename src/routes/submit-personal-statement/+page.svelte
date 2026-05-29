<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { personalStatementPendingGeneration } from '$lib/stores/personalStatementStore';
	import { browser } from '$app/environment';

	let { data } = $props();
	let session = $derived(data.session);

	let status = $state<'generating' | 'saving' | 'error'>('generating');
	let errorMessage = $state('');

	onMount(async () => {
		if (!browser) return;

		if (!session?.user) {
			goto('/auth?next=/personal-statements');
			return;
		}

		// Read form data from sessionStorage (set by PersonalStatementGenerator.svelte)
		let formData: any = null;
		try {
			const raw = sessionStorage.getItem('personalStatementFormData');
			if (raw) formData = JSON.parse(raw);
		} catch {
			// ignore
		}

		if (!formData) {
			goto('/personal-statements');
			return;
		}

		try {
			// Step 1: Generate the text
			const genRes = await fetch('/api/generate-personal-statement', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const genResult = await genRes.json();

			if (genRes.status === 402) {
				status = 'error';
				errorMessage = 'You don\'t have enough credits. Top up at abroaducate.com/pricing.';
				return;
			}

			if (!genRes.ok || genResult.error) {
				status = 'error';
				errorMessage = genResult.error || 'Generation failed. Please try again.';
				return;
			}

			// Step 2: Save to database
			status = 'saving';
			const saveRes = await fetch('/api/save-personal-statement', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					generatedContent: genResult.personalStatement,
					wordCount: genResult.personalStatement?.split(' ').length || 0
				})
			});

			const saveResult = await saveRes.json();

			if (!saveRes.ok || saveResult.error) {
				status = 'error';
				errorMessage = saveResult.error || 'Failed to save. Please try again.';
				return;
			}

			// Clear pending flag and session storage
			personalStatementPendingGeneration.set(false);
			sessionStorage.removeItem('personalStatementFormData');

			// Navigate to the personal statement editor
			goto(`/personal-statements/${saveResult.personalStatementId}`);
		} catch (err: any) {
			status = 'error';
			errorMessage = err?.message || 'Something went wrong. Please try again.';
		}
	});
</script>

<svelte:head>
	<title>Generating your Personal Statement... | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
		{#if status === 'generating' || status === 'saving'}
			<div class="flex justify-center mb-6">
				<div class="w-14 h-14 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin"></div>
			</div>
			<h1 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
				{status === 'saving' ? 'Saving your Personal Statement' : 'Writing your Personal Statement'}
			</h1>
			<p class="text-slate-500 text-sm leading-relaxed">
				{status === 'saving'
					? 'Almost done — saving your document...'
					: 'Our AI is crafting a personalised personal statement based on your profile. This usually takes 15–30 seconds.'}
			</p>
		{:else}
			<div class="flex justify-center mb-6">
				<div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
					<svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
			</div>
			<h1 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
				Something went wrong
			</h1>
			<p class="text-slate-500 text-sm mb-6 leading-relaxed">{errorMessage}</p>
			<div class="flex flex-col gap-3">
				<a
					href="/personal-statements"
					class="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
				>
					Go back and try again
				</a>
				{#if errorMessage.includes('credits')}
					<a
						href="/pricing"
						class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
					>
						Top up credits
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>
