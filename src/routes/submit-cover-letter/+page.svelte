<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { coverLetterPendingGeneration } from '$lib/stores/coverLetterStore';
	import { browser } from '$app/environment';

	let { data } = $props();
	let session = $derived(data.session);

	let status = $state<'generating' | 'error'>('generating');
	let errorMessage = $state('');

	onMount(async () => {
		if (!browser) return;

		if (!session?.user) {
			goto('/auth?next=/cover-letters');
			return;
		}

		// Read form data from sessionStorage (set by CoverLetterGenerator.svelte)
		let formData: any = null;
		try {
			const raw = sessionStorage.getItem('coverLetterFormData');
			if (raw) formData = JSON.parse(raw);
		} catch {
			// ignore
		}

		if (!formData) {
			goto('/cover-letters');
			return;
		}

		try {
			const res = await fetch('/api/generate-cover-letter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await res.json();

			if (res.status === 402) {
				// Insufficient credits
				status = 'error';
				errorMessage = 'You don\'t have enough credits. Top up at abroaducate.com/pricing.';
				return;
			}

			if (!res.ok || result.error) {
				status = 'error';
				errorMessage = result.error || 'Generation failed. Please try again.';
				return;
			}

			// Clear pending flag and session storage
			coverLetterPendingGeneration.set(false);
			sessionStorage.removeItem('coverLetterFormData');

			// Navigate to the cover letter editor
			goto(`/cover-letters/${result.coverLetterId}`);
		} catch (err: any) {
			status = 'error';
			errorMessage = err?.message || 'Something went wrong. Please try again.';
		}
	});
</script>

<svelte:head>
	<title>Generating your Cover Letter... | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
		{#if status === 'generating'}
			<div class="flex justify-center mb-6">
				<div class="w-14 h-14 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin"></div>
			</div>
			<h1 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
				Writing your Cover Letter
			</h1>
			<p class="text-slate-500 text-sm leading-relaxed">
				Our AI is crafting a personalised cover letter based on your profile. This usually takes 15–30 seconds.
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
					href="/cover-letters"
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
