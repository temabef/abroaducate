<script lang="ts">
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import AdSenseAd from '$lib/components/AdSenseAd.svelte';
	
	export let data;
	
	$: post = data.post;
	$: seo = data.seo;
	
	// Handle image loading errors
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.style.display = 'none';
	}
	
	function handleImageLoad(event: Event) {
		const img = event.target as HTMLImageElement;
		img.style.opacity = '1';
	}
	
	// YouTube video embedding function
	function embedYouTubeVideos(content: string): string {
		try {
			let processedContent = content;
		
		// AGGRESSIVE CLEANUP - Remove ALL iframe elements first
		processedContent = processedContent.replace(
			/<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
			''
		);
		
		// Remove any div that might contain YouTube embeds
		processedContent = processedContent.replace(
			/<div[^>]*(?:embed|video|youtube)[^>]*>[\s\S]*?<\/div>/gi,
			''
		);
		
		// Remove any figure elements that might contain embeds
		processedContent = processedContent.replace(
			/<figure[^>]*>[\s\S]*?<\/figure>/gi,
			''
		);
		
		// Remove any WordPress embed blocks
		processedContent = processedContent.replace(
			/<!-- wp:embed[^>]*-->[\s\S]*?<!-- \/wp:embed -->/gi,
			''
		);
		
		// Clean up orphaned HTML fragments and broken links
		processedContent = processedContent.replace(
			/["']>\s*/g,
			''
		);
		
		// Remove any remaining orphaned > symbols
		processedContent = processedContent.replace(
			/^\s*>\s*/gm,
			''
		);
		
		// Remove broken links that start with %3C (encoded <)
		processedContent = processedContent.replace(
			/<a[^>]*href="[^"]*%3C[^"]*"[^>]*>.*?<\/a>/gi,
			''
		);
		
		// Simple regex for YouTube watch URLs
		processedContent = processedContent.replace(
			/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
			'<div class="youtube-embed-container"><iframe src="https://www.youtube.com/embed/$1?rel=0&showinfo=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="YouTube Video"></iframe></div>'
		);
		
		// Simple regex for YouTube short URLs
		processedContent = processedContent.replace(
			/https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/g,
			'<div class="youtube-embed-container"><iframe src="https://www.youtube.com/embed/$1?rel=0&showinfo=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="YouTube Video"></iframe></div>'
		);
		
		return processedContent;
		} catch (error) {
			console.error('Error in embedYouTubeVideos:', error);
			return content; // Return original content if processing fails
		}
	}

	// Aggressive arrow removal function
	function removeArrows() {
		if (typeof window !== 'undefined') {
			const blogContent = document.querySelector('.blog-content');
			if (blogContent) {
				// Remove all elements containing arrows
				const elementsWithArrows = blogContent.querySelectorAll('*');
				elementsWithArrows.forEach(el => {
					// Check text content for arrows
					if (el.textContent && /[▲▼►◄↑↓→←]/.test(el.textContent)) {
						el.textContent = el.textContent.replace(/[▲▼►◄↑↓→←]/g, '');
					}
					
					// Remove arrow-related classes
					if (el.className) {
						el.className = el.className.replace(/\b(collapse|dropdown|toggle|expand|arrow)\S*/g, '');
					}
					
					// Remove arrow-related data attributes
					const attributes = Array.from(el.attributes);
					attributes.forEach(attr => {
						if (attr.name.includes('toggle') || attr.name.includes('collapse') || attr.name.includes('expand')) {
							el.removeAttribute(attr.name);
						}
					});
				});
				
				// Remove any ::after or ::before content with arrows
				const style = document.createElement('style');
				style.textContent = `
					.blog-content *::after,
					.blog-content *::before {
						content: none !important;
						display: none !important;
					}
					.blog-content ul li::before {
						content: "•" !important;
						display: inline-block !important;
						margin-right: 0.5rem !important;
						color: #374151 !important;
					}
					.blog-content ol li::before {
						content: counter(list-counter) "." !important;
						display: inline-block !important;
						margin-right: 0.5rem !important;
						color: #374151 !important;
					}
				`;
				document.head.appendChild(style);
			}
		}
	}
	
	// Remove existing YouTube embeds from DOM
	function removeDuplicateVideos() {
		if (typeof window !== 'undefined') {
			const blogContent = document.querySelector('.blog-content');
			if (blogContent) {
				// Remove all iframes that are NOT in our youtube-embed-container
				const iframes = blogContent.querySelectorAll('iframe:not(.youtube-embed-container iframe)');
				iframes.forEach(iframe => {
					iframe.remove();
				});
				
				// Remove all figure elements
				const figures = blogContent.querySelectorAll('figure');
				figures.forEach(figure => {
					figure.remove();
				});
				
				// Remove WordPress embed blocks
				const embeds = blogContent.querySelectorAll('.wp-block-embed, [class*="embed"]:not(.youtube-embed-container)');
				embeds.forEach(embed => {
					embed.remove();
				});
				
				// Remove any div that contains iframe with YouTube
				const divs = blogContent.querySelectorAll('div');
				divs.forEach(div => {
					if (div.innerHTML.includes('youtube.com') && !div.classList.contains('youtube-embed-container')) {
						div.remove();
					}
				});
				
				// Remove broken links with encoded HTML
				const brokenLinks = blogContent.querySelectorAll('a[href*="%3C"]');
				brokenLinks.forEach(link => {
					link.remove();
				});
				
				// Remove any text nodes that contain orphaned > symbols
				const walker = document.createTreeWalker(
					blogContent,
					NodeFilter.SHOW_TEXT,
					null,
					false
				);
				
				const textNodes = [];
				let node;
				while (node = walker.nextNode()) {
					textNodes.push(node);
				}
				
				textNodes.forEach(textNode => {
					if (textNode.textContent.trim() === '>' || textNode.textContent.trim() === '">') {
						textNode.remove();
					}
				});
			}
		}
	}

	// Run removal after component mounts
	import { onMount } from 'svelte';
	onMount(() => {
		// Temporarily disabled to debug disappearing posts
		console.log('Post loaded successfully');
		
		// Only run removeDuplicateVideos once and safely
		try {
			removeDuplicateVideos();
		} catch (e) {
			console.error('Error in removeDuplicateVideos:', e);
		}
		
		// Disable the aggressive arrow removal for now
		// removeArrows();
	});
</script>

<SEO
	title={seo.title}
	description={seo.description}
	canonical={seo.canonicalUrl}
	type={seo.type}
/>

<main class="min-h-screen bg-white">
	<!-- Hero Section with Cover Image -->
	{#if post.cover_image_url}
		<section class="relative h-64 sm:h-96 overflow-hidden mt-16">
			<div class="absolute inset-0">
				<img
					src={post.cover_image_url}
					alt={post.title}
					class="w-full h-full object-cover"
					style="object-fit: cover; object-position: 50% 10% !important; min-height: 100%; min-width: 100%;"
					onload={handleImageLoad}
					onerror={handleImageError}
					loading="lazy"
				/>
			</div>
			<!-- Gradient overlay for text readability -->
			<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
			
			<!-- Title and metadata overlay -->
			<div class="absolute inset-0 flex items-end">
				<div class="max-w-5xl mx-auto text-center p-6 w-full">
					<h1 class="text-3xl md:text-5xl font-bold text-white mb-4" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
						{post.title}
					</h1>
					<div class="text-white/90 text-sm md:text-base" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
						<time datetime={post.published_at}>
							{new Date(post.published_at).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<!-- Fallback header without image -->
		<section class="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 mt-16">
			<div class="max-w-5xl mx-auto text-center px-6">
				<h1 class="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
					{post.title}
				</h1>
				<div class="text-gray-600 text-sm md:text-base">
					<time datetime={post.published_at}>
						{new Date(post.published_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
				</div>
			</div>
		</section>
	{/if}

	<!-- Content Section -->
	<section class="py-12">
		<div class="max-w-6xl mx-auto px-6">
			<div class="lg:flex lg:gap-8">
				<!-- Main Content -->
				<article class="lg:w-3/4 min-w-0">
					<div class="blog-content w-full max-w-none">
						{@html (() => {
							try {
								// TEMPORARY DEBUG: Return raw content without any processing
								// This will help us identify if the issue is in embedYouTubeVideos or elsewhere
								let cleanContent = post.content || '';
								
								// Only remove arrow symbols, no other processing
								cleanContent = cleanContent.replace(/▲|▼|►|◄/g, '');
								
								// Skip YouTube embedding for now to isolate the linking issue
								return cleanContent;
								
								// TODO: Re-enable this after fixing the linking issue
								// return embedYouTubeVideos(cleanContent);
							} catch (error) {
								console.error('Error processing blog content:', error);
								// Fallback to raw content
								return post.content || 'Content could not be loaded.';
							}
						})()}
					</div>
					
					<!-- In-content Ad -->
					<div class="my-8 p-4 bg-gray-50 rounded-lg text-center">
						<AdSenseAd adSlot="6646272505" />
					</div>
				</article>

				<!-- Sidebar -->
				<aside class="lg:w-1/4 lg:max-w-xs mt-8 lg:mt-0">
					<div class="sticky top-24 space-y-6">
						<!-- Sidebar Ad -->
						<div class="p-4 bg-gray-50 rounded-lg text-center">
							<AdSenseAd adSlot="7563850500" />
						</div>

						<!-- Related Posts / CTA -->
						<div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
							<h3 class="font-bold text-gray-900 mb-3">Explore More Opportunities</h3>
							<p class="text-gray-600 text-sm mb-4">
								Discover scholarships, universities, and study abroad programs tailored for you.
							</p>
							<a
								href="/scholarships"
								class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
							>
								Browse Scholarships
							</a>
						</div>
					</div>
				</aside>
			</div>
		</div>
	</section>
</main>

<style>
	/* Blog content styling */
	:global(.blog-content) {
		line-height: 1.75;
		color: #374151;
	}
	
	/* Headers */
	:global(.blog-content h1) {
		font-size: 2.25rem;
		font-weight: 700;
		color: #111827;
		margin: 2rem 0 1rem 0;
		line-height: 1.2;
	}
	
	:global(.blog-content h2) {
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		margin: 1.75rem 0 0.75rem 0;
		line-height: 1.3;
	}
	
	:global(.blog-content h3) {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 1.5rem 0 0.75rem 0;
		line-height: 1.4;
	}
	
	:global(.blog-content h4) {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 1.25rem 0 0.5rem 0;
	}
	
	:global(.blog-content h5) {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 1rem 0 0.5rem 0;
	}
	
	/* Paragraphs */
	:global(.blog-content p) {
		margin: 1.5rem 0;
		line-height: 1.8;
		color: #374151;
		font-size: 1.1rem;
	}
	
	/* Lists - Force bullet points to show */
	:global(.blog-content ul) {
		margin: 1.5rem 0;
		padding-left: 0;
		list-style: none;
	}
	
	:global(.blog-content ol) {
		margin: 1.5rem 0;
		padding-left: 0;
		list-style: none;
		counter-reset: list-counter;
	}
	
	:global(.blog-content ul li) {
		margin: 0.75rem 0;
		line-height: 1.7;
		padding-left: 2rem;
		position: relative;
		display: block;
	}
	
	:global(.blog-content ul li::before) {
		content: "•";
		color: #374151;
		font-weight: bold;
		position: absolute;
		left: 0.75rem;
		top: 0;
		font-size: 1.2em;
	}
	
	:global(.blog-content ol li) {
		margin: 0.75rem 0;
		line-height: 1.7;
		padding-left: 2rem;
		position: relative;
		display: block;
		counter-increment: list-counter;
	}
	
	:global(.blog-content ol li::before) {
		content: counter(list-counter) ".";
		color: #374151;
		font-weight: 600;
		position: absolute;
		left: 0.75rem;
		top: 0;
	}
	
	/* Nested lists */
	:global(.blog-content ul ul) {
		margin: 0.5rem 0;
	}
	
	:global(.blog-content ul ul li::before) {
		content: "◦";
		font-size: 1.1em;
	}
	
	:global(.blog-content ul ul ul li::before) {
		content: "▪";
		font-size: 1em;
	}
	
	:global(.blog-content ol ol) {
		margin: 0.5rem 0;
		counter-reset: nested-counter;
	}
	
	:global(.blog-content ol ol li) {
		counter-increment: nested-counter;
	}
	
	:global(.blog-content ol ol li::before) {
		content: counter(nested-counter, lower-alpha) ".";
	}
	
	:global(.blog-content ol ol ol) {
		counter-reset: deep-counter;
	}
	
	:global(.blog-content ol ol ol li) {
		counter-increment: deep-counter;
	}
	
	:global(.blog-content ol ol ol li::before) {
		content: counter(deep-counter, lower-roman) ".";
	}
	
	/* Links */
	:global(.blog-content a) {
		color: #2563eb;
		text-decoration: underline;
		transition: color 0.2s;
	}
	
	:global(.blog-content a:hover) {
		color: #1d4ed8;
	}
	
	/* Strong/Bold */
	:global(.blog-content strong, .blog-content b) {
		font-weight: 700;
		color: #111827;
	}
	
	/* Emphasis/Italic */
	:global(.blog-content em, .blog-content i) {
		font-style: italic;
	}
	
	/* Handle any remaining asterisk formatting that didn't convert */
	:global(.blog-content) {
		/* This is a fallback - ideally all should be converted by markdown-it */
	}
	
	/* Images */
	:global(.blog-content img) {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 1.5rem auto;
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	/* Blockquotes */
	:global(.blog-content blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #6b7280;
	}
	
	/* Code blocks */
	:global(.blog-content pre) {
		background: #f3f4f6;
		color: #374151;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		margin: 1.5rem 0;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
	}
	
	/* Inline code */
	:global(.blog-content code:not(pre code)) {
		background: #f3f4f6;
		color: #374151;
		padding: 0.125rem 0.25rem;
		border-radius: 4px;
		font-size: 0.875em;
		font-family: 'Courier New', monospace;
	}
	
	/* Tables */
	:global(.blog-content table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}
	
	:global(.blog-content th, .blog-content td) {
		border: 1px solid #e5e7eb;
		padding: 0.75rem;
		text-align: left;
	}
	
	:global(.blog-content th) {
		background: #f9fafb;
		font-weight: 600;
	}
	
	/* Main blog content container */
	:global(.blog-content) {
		background: white;
		color: #374151;
		max-width: 100%;
		overflow-wrap: break-word;
		word-wrap: break-word;
		line-height: 1.75;
		font-size: 1.1rem;
		overflow-x: hidden;
	}
	
	/* Ensure content doesn't overflow */
	:global(.blog-content *) {
		background: transparent !important;
		max-width: 100% !important;
		box-sizing: border-box !important;
		overflow-x: hidden !important;
	}
	
	/* Prevent any elements from causing horizontal scroll */
	:global(.blog-content pre) {
		overflow-x: auto !important;
		max-width: 100% !important;
		white-space: pre-wrap !important;
		word-wrap: break-word !important;
	}
	
	/* Force long words and URLs to break */
	:global(.blog-content p, .blog-content li, .blog-content div) {
		word-break: break-word !important;
		overflow-wrap: break-word !important;
		hyphens: auto !important;
	}
	
	/* Specific handling for text with asterisks that might not convert */
	:global(.blog-content) {
		white-space: normal !important;
		word-wrap: break-word !important;
	}
	
	/* Ensure no element can cause horizontal scroll */
	:global(.blog-content > *) {
		max-width: 100% !important;
		box-sizing: border-box !important;
	}
	
	/* Remove any unwanted arrows or interactive elements */
	:global(.blog-content *::after) {
		content: "" !important;
		display: none !important;
	}
	
	:global(.blog-content button) {
		display: none !important;
	}
	
	:global(.blog-content .collapse-toggle) {
		display: none !important;
	}
	
	:global(.blog-content .expand-toggle) {
		display: none !important;
	}
	
	/* Specifically target and hide arrow elements */
	:global(.blog-content [class*="arrow"]) {
		display: none !important;
	}
	
	:global(.blog-content [class*="toggle"]) {
		display: none !important;
	}
	
	:global(.blog-content [class*="expand"]) {
		display: none !important;
	}
	
	:global(.blog-content [class*="collapse"]) {
		display: none !important;
	}
	
	/* Override any existing pseudo-elements that might add arrows */
	:global(.blog-content li::after) {
		content: "" !important;
		display: none !important;
	}
	
	:global(.blog-content p::after) {
		content: "" !important;
		display: none !important;
	}
	
	/* Make sure only our bullet shows */
	:global(.blog-content ul li) {
		list-style: none !important;
		background: none !important;
	}
	
	/* DAISYUI OVERRIDE - Disable all DaisyUI interactive components in blog content */
	:global(.blog-content .collapse) {
		display: block !important;
	}
	
	:global(.blog-content .collapse-title) {
		cursor: default !important;
		pointer-events: none !important;
	}
	
	:global(.blog-content .collapse-content) {
		display: block !important;
		max-height: none !important;
		padding: 0 !important;
	}
	
	:global(.blog-content .collapse-arrow) {
		display: none !important;
	}
	
	:global(.blog-content .collapse:not(.collapse-open) .collapse-content) {
		display: block !important;
	}
	
	/* Remove DaisyUI dropdown indicators */
	:global(.blog-content .dropdown) {
		position: static !important;
	}
	
	:global(.blog-content .dropdown-content) {
		position: static !important;
		display: block !important;
		opacity: 1 !important;
		visibility: visible !important;
	}
	
	/* Nuclear option - hide ALL ::after pseudo-elements except our bullets */
	:global(.blog-content *:not(ul li)::after) {
		content: none !important;
		display: none !important;
	}
	
	:global(.blog-content *:not(ol li)::after) {
		content: none !important;
		display: none !important;
	}
	
	/* Ensure our custom bullets are the only ones showing */
	:global(.blog-content ul li::after) {
		content: none !important;
		display: none !important;
	}
	
	:global(.blog-content ol li::after) {
		content: none !important;
		display: none !important;
	}
	
	/* Remove any DaisyUI indicators completely */
	:global(.blog-content [class*="indicator"]) {
		display: none !important;
	}
	
	/* Reset any Tailwind/DaisyUI utility classes on lists */
	:global(.blog-content ul) {
		@apply !list-none;
	}
	
	:global(.blog-content li) {
		@apply !list-none;
		position: relative !important;
	}
	
	/* Completely disable any hover effects that might add arrows */
	:global(.blog-content li:hover::after) {
		content: none !important;
		display: none !important;
	}
	
	:global(.blog-content li:hover::before) {
		content: "•" !important;
		display: inline-block !important;
	}
	
	/* NUCLEAR OPTION - Override EVERYTHING */
	:global(.blog-content) * {
		position: relative !important;
	}
	
	:global(.blog-content) *::after {
		content: "" !important;
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
		width: 0 !important;
		height: 0 !important;
	}
	
	:global(.blog-content) *::before {
		content: "" !important;
		display: none !important;
		visibility: hidden !important;
		opacity: 0 !important;
		width: 0 !important;
		height: 0 !important;
	}
	
	/* Force our bullets back */
	:global(.blog-content ul li::before) {
		content: "•" !important;
		display: inline-block !important;
		visibility: visible !important;
		opacity: 1 !important;
		width: auto !important;
		height: auto !important;
		margin-right: 0.5rem !important;
		color: #374151 !important;
		font-weight: bold !important;
	}
	
	:global(.blog-content ol) {
		counter-reset: list-counter !important;
	}
	
	:global(.blog-content ol li) {
		counter-increment: list-counter !important;
	}
	
	:global(.blog-content ol li::before) {
		content: counter(list-counter) "." !important;
		display: inline-block !important;
		visibility: visible !important;
		opacity: 1 !important;
		width: auto !important;
		height: auto !important;
		margin-right: 0.5rem !important;
		color: #374151 !important;
		font-weight: 600 !important;
	}
	
	/* HIDE ALL EXISTING YOUTUBE EMBEDS */
	:global(.blog-content iframe:not(.youtube-embed-container iframe)) {
		display: none !important;
		visibility: hidden !important;
		width: 0 !important;
		height: 0 !important;
	}
	
	:global(.blog-content figure) {
		display: none !important;
	}
	
	:global(.blog-content .wp-block-embed) {
		display: none !important;
	}
	
	:global(.blog-content [class*="embed"]:not(.youtube-embed-container)) {
		display: none !important;
	}

	/* YouTube Embed Styling */
	:global(.blog-content .youtube-embed-container) {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		margin: 1.5rem 0;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		background: #000;
	}
	
	:global(.blog-content .youtube-embed-container iframe) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 8px;
	}
	
	/* Mobile optimization for YouTube embeds */
	@media (max-width: 768px) {
		:global(.blog-content .youtube-embed-container) {
			margin: 1rem 0 !important;
			border-radius: 6px !important;
		}
	}

	/* Fix any potential table overflow */
	:global(.blog-content table) {
		width: 100%;
		max-width: 100%;
		overflow-x: auto;
		display: table;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}
	
	/* Ensure proper spacing and readability */
	:global(.blog-content > *:first-child) {
		margin-top: 0;
	}
	
	:global(.blog-content > *:last-child) {
		margin-bottom: 0;
	}
</style>
