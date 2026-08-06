<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = {
		slot: string;
		format?: string;
		label?: string;
	};

	let { slot, format = 'auto', label = 'Advertisement' }: Props = $props();

	onMount(() => {
		if (browser) {
			try {
				(window.adsbygoogle = window.adsbygoogle || []).push({});
			} catch (e) {
				console.error('AdSense error:', e);
			}
		}
	});
</script>

<div class="blog-ad-container">
	{#if label}
		<span class="ad-label">{label}</span>
	{/if}
	<ins
		class="adsbygoogle"
		style="display:block; margin: 1rem 0;"
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
	}

	.ad-label {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	/* Responsive spacing */
	@media (max-width: 768px) {
		.blog-ad-container {
			margin: 2rem auto;
		}
	}
</style>
