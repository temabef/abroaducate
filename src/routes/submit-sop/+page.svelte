<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { pendingGeneration, formStore } from '$lib/stores';
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let session = $derived(data.session);

	let status = $state<'generating' | 'error'>('generating');
	let errorMessage = $state('');

	onMount(async () => {
		if (!browser) return;

		// Redirect to auth if not logged in
		if (!session?.user) {
			goto('/auth?next=/sop');
			return;
		}

		// Read form data from sessionStorage (set by FormSection.svelte)
		let formData: any = null;
		try {
			const raw = sessionStorage.getItem('formState');
			if (raw) formData = JSON.parse(raw);
		} catch {
			// ignore parse errors
		}

		if (!formData) {
			// Nothing to generate — go back to the form
			goto('/sop');
			return;
		}

		try {
			const res = await fetch('/api/generate-sop', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await res.json();

			if (!res.ok || result.error) {
				status = 'error';
				errorMessage = result.error || result.details || 'Generation failed. Please try again.';
				return;
			}

			// Clear pending flag and session storage
			pendingGeneration.set(false);
			sessionStorage.removeItem('formState');

			// Navigate to the SOP editor
			goto(`/sop/${result.sopId}`);
		} catch (err: any) {
			status = 'error';
			errorMessage = err?.message || 'Something went wrong. Please try again.';
		}
	});
</script>

<svelte:head>
	<title>Generating your SOP... | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
		{#if status === 'generating'}
			<div class="flex justify-center mb-6">
				<div class="w-14 h-14 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin"></div>
			</div>
			<h1 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
				Writing your Statement of Purpose
			</h1>
			<p class="text-slate-500 text-sm leading-relaxed">
				Our AI is crafting a personalised SOP based on your profile. This usually takes 15–30 seconds.
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
			<a
				href="/sop"
				class="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
			>
				Go back and try again
			</a>
		{/if}
	</div>
</div>
