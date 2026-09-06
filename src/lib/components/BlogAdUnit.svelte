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
		label = 'Sponsored',
		minHeight = '250px'
	}: Props = $props();

	onMount(() => {
		if (browser) {
			try {
				((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
			} catch (e) {
				console.warn('[AdSense] Unit push note:', e);
			}
		}
	});
</script>

<div class="blog-ad-container" style="min-height: {minHeight};">
	{#if label}
		<span class="ad-label">{label}</span>
	{/if}
	<ins
		class="adsbygoogle"
		style="display:block; width: 100%; text-align: center;"
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
		margin: 2rem auto;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		clear: both;
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

	@media (max-width: 768px) {
		.blog-ad-container {
			margin: 1.5rem auto;
			min-height: 120px !important;
		}
	}
</style>
