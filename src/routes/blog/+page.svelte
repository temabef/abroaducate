<script lang="ts">
  import type { PageData } from './$types';
  import SEO from '$lib/components/SEO.svelte';
  import AdSenseAd from '$lib/components/AdSenseAd.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page as currentPage } from '$app/stores';

  let { data }: { data: PageData } = $props();
  
  // Reactive destructuring to update when data changes
  const posts = $derived(data.posts);
  const total = $derived(data.total);
  const page = $derived(data.page);
  const pageSize = $derived(data.pageSize);
  const search = $derived(data.search);
  const totalPages = $derived(data.totalPages);

  let searchQuery = $state('');

  // Update search query when data changes
  $effect(() => {
    searchQuery = search || '';
  });

  function handleSearch(e: Event) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    goto(`/blog?${params.toString()}`);
  }

  async function goToPage(pageNum: number) {
    const params = new URLSearchParams();
    if (pageNum > 1) params.set('page', pageNum.toString());
    if (search) params.set('search', search);
    
    // Use goto with invalidateAll to ensure fresh data
    await invalidateAll();
    await goto(`/blog?${params.toString()}`, { replaceState: false });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<SEO
  title="Blog - Study Abroad Insights"
  description="Expert guides, tips, and insights for your study abroad journey. From university applications to scholarship opportunities."
  schemaType="WebPage"
/>

<!-- Header Section with Faint Blue Background -->
<section class="bg-gradient-to-b from-blue-50 to-white py-16">
  <div class="container mx-auto px-4 pt-8 pb-12">
    <div class="text-center mb-8">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Study Abroad Blog</h1>
      <p class="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
        Your comprehensive guide to studying abroad, scholarships, and university applications
      </p>
      
      <!-- Search Bar -->
      <form onsubmit={handleSearch} class="max-w-md mx-auto">
        <div class="relative">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search articles..."
            class="w-full px-6 py-3 border border-gray-200 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          />
          <button
            type="submit"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
            aria-label="Search articles"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</section>

<!-- Posts Section -->
<section class="bg-white">
  <div class="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
  {#if search}
    <div class="mb-8">
      <p class="text-gray-600">
        {total > 0 ? `Found ${total} articles` : 'No articles found'} for "{search}"
        <a href="/blog" class="text-blue-600 hover:underline ml-2">Clear search</a>
      </p>
    </div>
  {/if}

  {#if posts.length === 0}
    <div class="text-center py-16">
      <div class="text-6xl mb-4">📚</div>
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
        {search ? 'No articles found' : 'No blog posts yet'}
      </h2>
      <p class="text-gray-600">
        {search ? 'Try searching for something else.' : 'Check back soon for new content!'}
      </p>
    </div>
  {:else}
    <!-- Posts Grid with Sidebar Layout -->
    <div class="grid lg:grid-cols-3 gap-12">
      <!-- Main Content - Posts Grid (2 columns max) -->
      <div class="lg:col-span-2">
        <div class="grid gap-8 md:grid-cols-2">
      {#each posts as post}
        <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {#if post.thumbnail_url}
            <div class="aspect-video overflow-hidden">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onerror={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target) {
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><div class="text-gray-400 text-4xl">📖</div></div>';
                    }
                  }
                }}
              />
            </div>
          {:else}
            <div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div class="text-gray-400 text-4xl">📖</div>
            </div>
          {/if}
          
          <div class="p-6">
            <div class="flex items-center text-sm text-gray-500 mb-3">
              <time>{formatDate(post.published_at)}</time>
              <span class="mx-2">•</span>
              <span>{post.reading_time} min read</span>
            </div>
            
            <h2 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
              <a href="/blog/{post.slug}" class="hover:text-blue-600 transition-colors">
                {post.title}
              </a>
            </h2>
            
            {#if post.excerpt}
              <p class="text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
            {/if}
            
            <a
              href="/blog/{post.slug}"
              class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Read More
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </article>
      {/each}
        </div>
      </div>

      <!-- Right Sidebar with Ads -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 space-y-6">
          <!-- Google Ads - Vertical Banner -->
          <AdSenseAd 
            adSlot="6442575607"
            adFormat="auto"
            className="sidebar-ad"
          />



          <!-- Quick Links -->
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <nav class="space-y-2">
              <a href="/scholarships" class="block text-blue-600 hover:text-blue-800 text-sm">
                Find Scholarships
              </a>
              <a href="/universities" class="block text-blue-600 hover:text-blue-800 text-sm">
                University Database
              </a>
              <a href="/test-prep" class="block text-blue-600 hover:text-blue-800 text-sm">
                IELTS Preparation
              </a>
              <a href="/visa-guide" class="block text-blue-600 hover:text-blue-800 text-sm">
                Visa Guidelines
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center mt-12 space-x-2">
        {#if page > 1}
          <button
            onclick={() => goToPage(page - 1)}
            class="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            ← Previous
          </button>
        {/if}
        
        {#each Array(totalPages) as _, i}
          {@const pageNum = i + 1}
          {#if pageNum === page}
            <span class="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {pageNum}
            </span>
          {:else if Math.abs(pageNum - page) <= 2 || pageNum === 1 || pageNum === totalPages}
            <button
              onclick={() => goToPage(pageNum)}
              class="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {pageNum}
            </button>
          {:else if Math.abs(pageNum - page) === 3}
            <span class="px-2 py-2 text-gray-400">...</span>
          {/if}
        {/each}
        
        {#if page < totalPages}
          <button
            onclick={() => goToPage(page + 1)}
            class="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Next →
          </button>
        {/if}
      </div>
    {/if}
  {/if}
  </div>
</section>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .aspect-video {
    aspect-ratio: 16 / 9;
  }
</style>