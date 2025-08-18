<script lang="ts">
  import type { PageData } from './$types';
  import SEO from '$lib/components/SEO.svelte';
  import AdSenseAd from '$lib/components/AdSenseAd.svelte';

  let { data }: { data: PageData } = $props();
  const { post, html } = data;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function shareOnTwitter() {
    const text = `Check out: ${post.title}`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
  }

  function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    // Could add a toast notification here
  }
</script>

<SEO
  title={post.title}
  description={post.excerpt || `Read ${post.title} on our study abroad blog`}
  ogImage={post.cover_image_url}
  schemaType="Article"
/>

<article class="bg-white">
  <!-- Hero Section -->
  {#if post.cover_image_url}
    <div class="relative h-64 sm:h-96 overflow-hidden bg-gray-900 mt-16">
      <img
        src={post.cover_image_url}
        alt={post.title}
        class="w-full h-full block"
        style="object-fit: cover; object-position: 50% 10% !important; min-height: 100%; min-width: 100%;"
        loading="eager"
        onerror={(e) => {
          e.target.style.display = 'none';
          // Hide the overlay if image fails to load
          const overlay = e.target.parentElement.querySelector('.bg-black');
          if (overlay) overlay.style.display = 'none';
        }}
      />
      <!-- Gradient overlay for better text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      
      <!-- Title Overlay -->
      <div class="absolute inset-0 flex items-end">
        <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-8 w-full">
          <div class="max-w-5xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
              {post.title}
            </h1>
            <div class="flex items-center justify-center text-white/90 space-x-4" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
              <time class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                </svg>
                {formatDate(post.published_at)}
              </time>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                </svg>
                {post.reading_time} min read
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Clean text-only header with gradient background -->
    <div class="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b">
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-12">
        <div class="max-w-5xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <div class="flex items-center justify-center text-gray-600 space-x-6">
            <time class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
              </svg>
              {formatDate(post.published_at)}
            </time>
            <span class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
              {post.reading_time} min read
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content -->
  <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
    <div class="max-w-5xl mx-auto">
      <div class="grid lg:grid-cols-4 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-3">
          {#if post.excerpt}
            <div class="bg-gray-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
              <p class="text-lg text-gray-700 italic leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          {/if}

          <div class="prose prose-lg max-w-none">
            {@html html}
          </div>

          <!-- In-Content Ad -->
          <AdSenseAd 
            adSlot="6646272505"
            adFormat="auto"
            variant="in-article"
            className="in-content-ad"
          />

          <!-- Share Section -->
          <div class="mt-12 pt-8 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
            <div class="flex items-center space-x-4">
              <button
                onclick={shareOnTwitter}
                class="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>

              <button
                onclick={shareOnLinkedIn}
                class="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>

              <button
                onclick={copyLink}
                class="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Google Ads - Vertical Banner -->
            <AdSenseAd 
              adSlot="7563850500"
              adFormat="auto"
              className="sidebar-ad"
            />

            <!-- Navigation -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Navigation</h3>
              <nav class="space-y-2">
                <a href="/blog" class="block text-blue-600 hover:text-blue-800 text-sm">
                  ← Back to Blog
                </a>
                <a href="/scholarships" class="block text-blue-600 hover:text-blue-800 text-sm">
                  Find Scholarships
                </a>
                <a href="/universities" class="block text-blue-600 hover:text-blue-800 text-sm">
                  University Database
                </a>
                <a href="/test-prep" class="block text-blue-600 hover:text-blue-800 text-sm">
                  Test Preparation
                </a>
              </nav>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>
</article>

<style>
  .prose {
    color: #374151;
    line-height: 1.7;
  }

  .prose h1,
  .prose h2,
  .prose h3 {
    color: #111827;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .prose h1 {
    font-size: 2rem;
  }

  .prose h2 {
    font-size: 1.5rem;
  }

  .prose h3 {
    font-size: 1.25rem;
  }

  .prose p {
    margin-bottom: 1.5rem;
    font-size: 1.125rem;
  }

  .prose img {
    width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 2rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .prose a {
    color: #2563eb;
    text-decoration: underline;
  }

  .prose a:hover {
    color: #1d4ed8;
  }

  .prose strong {
    font-weight: 600;
    color: #111827;
  }

  .prose em {
    font-style: italic;
  }

  .prose ul {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
  }
</style>