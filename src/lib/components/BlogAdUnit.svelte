<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = {
		slot: string;
		format?: string;
		label?: string;
		minHeight?: string;
	};

	let { 
		slot, 
		format = 'auto', 
		label = 'Advertisement',
		minHeight = '280px'
	}: Props = $props();

	let insElement: HTMLElement | undefined = $state();
	let initialized = false;
	let attempts = 0;
	const maxAttempts = 15;

	function initAd() {
		if (!browser || initialized || !insElement) return;

		// Check if already processed by AdSense
		if (insElement.getAttribute('data-adsbygoogle-status')) {
			initialized = true;
			return;
		}

		try {
			if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
				// Ensure element is attached to DOM and has width
				if (insElement.offsetWidth > 0) {
					((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
					initialized = true;
				} else if (attempts < maxAttempts) {
					attempts++;
					setTimeout(initAd, 250);
				}
			} else if (attempts < maxAttempts) {
				attempts++;
				setTimeout(initAd, 250);
			}
		} catch (e) {
			console.warn('[AdSense] Unit init notice:', e);
			initialized = true;
		}
	}

	onMount(() => {
		// Small delay to allow Svelte DOM hydration
		const timer = setTimeout(initAd, 150);
		return () => clearTimeout(timer);
	});
</script>

<div class="blog-ad-container" style="min-height: {minHeight};">
	{#if label}
		<span class="ad-label">{label}</span>
	{/if}
	<ins
		bind:this={insElement}
		class="adsbygoogle"
		style="display:block; min-height: 250px; width: 100%;"
		data-ad-client="ca-pub-9343038264406927"
		data-ad-slot={slot}
		data-ad-format={format}
		data-full-width-responsive="true"
	></ins>
</div>

<style>
	.blog-ad-container {
		width: 100%;
		max-width: 100%;
		margin: 2.5rem auto;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: visible;
	}

	.ad-label {
		display: block;
		font-size: 0.7rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	/* Responsive spacing */
	@media (max-width: 768px) {
		.blog-ad-container {
			margin: 1.75rem auto;
			min-height: 120px !important;
		}
	}
</style>
