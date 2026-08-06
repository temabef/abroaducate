<script lang="ts">
	/**
	 * YouTubeEmbed component
	 * Extracts video ID from various YouTube URL formats and creates responsive embed
	 * Uses youtube-nocookie.com for better privacy and fewer embed restrictions
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
	const embedUrl = $derived(videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` : null);
</script>

{#if embedUrl}
	<div class="youtube-embed-container">
		<iframe
			src={embedUrl}
			title={title}
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			referrerpolicy="strict-origin-when-cross-origin"
			allowfullscreen
			class="youtube-embed-iframe"
		></iframe>
	</div>
	<div class="mt-3 text-center">
		<a 
			href="https://www.youtube.com/watch?v={videoId}" 
			target="_blank" 
			rel="noopener noreferrer"
			class="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
			</svg>
			Watch on YouTube
		</a>
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
