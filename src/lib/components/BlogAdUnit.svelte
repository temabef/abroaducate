<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = {
		slot: string;
		format?: string;
		layout?: string;
		label?: string;
		minHeight?: string;
		responsive?: boolean;
	};

	let { 
		slot, 
		format = 'auto', 
		layout = '',
		label = 'Advertisement',
		minHeight = '250px',
		responsive = true
	}: Props = $props();

	let insElement: HTMLElement | null = $state(null);
	let adPushed = $state(false);

	function pushAd() {
		if (!browser || adPushed || !insElement) return;

		try {
			// Avoid duplicate push on an already processed ins element
			if (insElement.getAttribute('data-adsbygoogle-status')) {
				adPushed = true;
				return;
			}

			if ((window as any).adsbygoogle) {
				((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
				adPushed = true;
			} else {
				// Retry if Google script is still initializing
				setTimeout(pushAd, 250);
			}
		} catch (e) {
			console.warn('[AdSense] Unit push note:', e);
		}
	}

	onMount(() => {
		if (browser) {
			// Small tick ensures DOM element has non-zero computed layout
			const timer = setTimeout(pushAd, 150);
			return () => clearTimeout(timer);
		}
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
		data-ad-layout={layout || undefined}
		data-full-width-responsive={responsive && format === 'auto' ? 'true' : 'false'}
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
		clear: both;
	}

	/* Gracefully collapse container if AdSense reports unfilled */
	.blog-ad-container:has(ins[data-ad-status="unfilled"]) {
		display: none !important;
		min-height: 0 !important;
		margin: 0 !important;
		padding: 0 !important;
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
