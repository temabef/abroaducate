<script lang="ts">
	/**
	 * YouTubeEmbed component
	 * Extracts video ID from various YouTube URL formats and creates responsive embed
	 */
	
	type Props = {
		url: string;
		title?: string;
	};
	
	let { url, title = 'Video' }: Props = $props();
	
	/**
	 * Extract YouTube video ID from various URL formats:
	 * - https://www.youtube.com/watch?v=VIDEO_ID
	 * - https://youtu.be/VIDEO_ID
	 * - https://www.youtube.com/embed/VIDEO_ID
	 * - VIDEO_ID (bare ID)
	 */
	function extractVideoId(url: string): string | null {
		if (!url) return null;
		
		// Already a bare video ID (11 characters, alphanumeric + underscore/dash)
		if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
			return url.trim();
		}
		
		// youtube.com/watch?v=VIDEO_ID
		const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
		if (watchMatch) return watchMatch[1];
		
		// youtu.be/VIDEO_ID
		const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
		if (shortMatch) return shortMatch[1];
		
		// youtube.com/embed/VIDEO_ID
		const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
		if (embedMatch) return embedMatch[1];
		
		return null;
	}
	
	const videoId = $derived(extractVideoId(url));
</script>

{#if videoId}
	<div class="youtube-embed-container">
		<iframe
			src="https://www.youtube.com/embed/{videoId}"
			title={title}
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
			class="youtube-embed-iframe"
		></iframe>
	</div>
{:else}
	<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
		<p><strong>Invalid YouTube URL:</strong> Please provide a valid YouTube video URL or video ID.</p>
		<p class="text-xs mt-2 text-red-600">Supported formats: youtube.com/watch?v=ID, youtu.be/ID, or bare video ID</p>
	</div>
{/if}

<style>
	.youtube-embed-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
	}
	
	.youtube-embed-iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 1rem;
	}
</style>
