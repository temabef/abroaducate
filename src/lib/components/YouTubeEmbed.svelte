<script lang="ts">
	/**
	 * YouTubeEmbed component
	 * Hybrid approach: Try iframe embed first, fallback to clickable thumbnail
	 */
	
	type Props = {
		url: string;
		title?: string;
	};
	
	let { url, title = 'Video' }: Props = $props();
	let embedFailed = $state(false);
	let iframeLoaded = $state(false);
	
	/**
	 * Extract YouTube video ID from various URL formats
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
	const embedUrl = $derived(videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0` : null);
	const thumbnailUrl = $derived(videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);
	const watchUrl = $derived(videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);
	
	function handleIframeLoad() {
		iframeLoaded = true;
	}
	
	function handleIframeError() {
		embedFailed = true;
	}
	
	// Check if iframe is blocked after 3 seconds
	let embedCheckTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (embedUrl && !embedFailed) {
			embedCheckTimeout = setTimeout(() => {
				if (!iframeLoaded) {
					embedFailed = true;
				}
			}, 3000);
		}
		return () => {
			if (embedCheckTimeout) clearTimeout(embedCheckTimeout);
		};
	});
</script>

{#if videoId}
	{#if !embedFailed}
		<!-- Try iframe embed first -->
		<div class="youtube-embed-container">
			<iframe
				src={embedUrl}
				title={title}
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				allowfullscreen
				class="youtube-embed-iframe"
				onload={handleIframeLoad}
				onerror={handleIframeError}
			></iframe>
		</div>
	{:else}
		<!-- Fallback: Clickable thumbnail -->
		<a 
			href={watchUrl} 
			target="_blank" 
			rel="noopener noreferrer"
			class="youtube-thumbnail-link"
		>
			<div class="youtube-thumbnail-container">
				<img 
					src={thumbnailUrl} 
					alt={title}
					class="youtube-thumbnail-img"
				/>
				<div class="youtube-play-button">
					<svg width="68" height="48" viewBox="0 0 68 48" fill="none">
						<path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
						<path d="M45 24 27 14v20" fill="#fff"/>
					</svg>
				</div>
				<div class="youtube-thumbnail-overlay">
					<span class="youtube-watch-text">Click to watch on YouTube</span>
				</div>
			</div>
		</a>
	{/if}
	
	<!-- Always show "Watch on YouTube" link -->
	<div class="mt-3 text-center">
		<a 
			href={watchUrl} 
			target="_blank" 
			rel="noopener noreferrer"
			class="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
			</svg>
			{embedFailed ? 'Watch on YouTube' : 'Open on YouTube'}
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
	
	/* Clickable thumbnail fallback */
	.youtube-thumbnail-link {
		display: block;
		text-decoration: none;
	}
	
	.youtube-thumbnail-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%;
		height: 0;
		overflow: hidden;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.youtube-thumbnail-link:hover .youtube-thumbnail-container {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
	}
	
	.youtube-thumbnail-img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 1rem;
	}
	
	.youtube-play-button {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		transition: transform 0.2s ease;
	}
	
	.youtube-thumbnail-link:hover .youtube-play-button {
		transform: translate(-50%, -50%) scale(1.1);
	}
	
	.youtube-thumbnail-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
		padding: 2rem 1.5rem 1rem;
		border-radius: 0 0 1rem 1rem;
		z-index: 1;
	}
	
	.youtube-watch-text {
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
