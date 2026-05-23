<script lang="ts">
  import type { PageData } from './$types';
  import SEO from '$lib/components/SEO.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page as currentPage } from '$app/stores';
  import { Search, ChevronRight, BookOpen } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  const posts = $derived(data.posts);
  const total = $derived(data.total);
  const page = $derived(data.page);
  const pageSize = $derived(data.pageSize);
  const search = $derived(data.search);
  const totalPages = $derived(data.totalPages);

  let searchQuery = $state('');

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
  title="Blog — Study Abroad Insights"
  description="Expert guides, tips, and insights for your study abroad journey. From university applications to scholarship opportunities."
  schemaType="WebPage"
/>

<!-- Header -->
<section class="blog-header">
  <div class="blog-header-inner">
    <span class="eyebrow">BLOG</span>
    <h1 class="blog-title">Study Abroad Insights</h1>
    <p class="blog-subtitle">Expert guides, tips, and insights for your study abroad journey.</p>

    <!-- Search Bar -->
    <form onsubmit={handleSearch} class="search-form">
      <div class="search-bar">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search articles..."
          class="search-input"
        />
        <button type="submit" class="search-btn" aria-label="Search articles">
          Search
        </button>
      </div>
    </form>
  </div>
</section>

<!-- Posts Section -->
<section class="blog-body">
  <div class="blog-container">

    {#if search}
      <div class="search-result-bar">
        <p>
          {total > 0 ? `${total} article${total === 1 ? '' : 's'}` : 'No articles'} for "<strong>{search}</strong>"
          <a href="/blog" class="clear-search">Clear search</a>
        </p>
      </div>
    {/if}

    {#if posts.length === 0}
      <!-- Empty state -->
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <BookOpen size={28} />
        </div>
        <h2>{search ? 'No articles found' : 'No blog posts yet'}</h2>
        <p>{search ? 'Try searching for something else.' : 'Check back soon for new content!'}</p>
      </div>
    {:else}
      <div class="posts-layout">
        <!-- Posts grid -->
        <div class="posts-grid-wrap">
          <div class="posts-grid">
            {#each posts as post}
              <article class="post-card">
                <!-- Thumbnail -->
                {#if post.thumbnail_url}
                  <div class="post-thumb">
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      class="post-thumb-img"
                      onerror={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target && target.parentElement) {
                          target.style.display = 'none';
                          target.parentElement.classList.add('post-thumb-fallback');
                        }
                      }}
                    />
                  </div>
                {:else}
                  <div class="post-thumb post-thumb-fallback"></div>
                {/if}

                <div class="post-body">
                  <div class="post-meta">
                    <time>{formatDate(post.published_at)}</time>
                    <span class="post-meta-dot">&middot;</span>
                    <span>{post.reading_time} min read</span>
                  </div>

                  <h2 class="post-title">
                    <a href="/blog/{post.slug}">{post.title}</a>
                  </h2>

                  {#if post.excerpt}
                    <p class="post-excerpt">{post.excerpt}</p>
                  {/if}

                  <a href="/blog/{post.slug}" class="post-read-more">
                    Read more <ChevronRight size={14} />
                  </a>
                </div>
              </article>
            {/each}
          </div>

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="pagination">
              {#if page > 1}
                <button onclick={() => goToPage(page - 1)} class="page-btn page-btn-nav">
                  &larr; Previous
                </button>
              {/if}

              {#each Array(totalPages) as _, i}
                {@const pageNum = i + 1}
                {#if pageNum === page}
                  <span class="page-btn page-btn-active">{pageNum}</span>
                {:else if Math.abs(pageNum - page) <= 2 || pageNum === 1 || pageNum === totalPages}
                  <button onclick={() => goToPage(pageNum)} class="page-btn">{pageNum}</button>
                {:else if Math.abs(pageNum - page) === 3}
                  <span class="page-ellipsis">&hellip;</span>
                {/if}
              {/each}

              {#if page < totalPages}
                <button onclick={() => goToPage(page + 1)} class="page-btn page-btn-nav">
                  Next &rarr;
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">Explore Platform</h3>
            <nav class="sidebar-nav">
              <a href="/programs" class="sidebar-link">
                <ChevronRight size={14} /> Find Programs
              </a>
              <a href="/scholarships" class="sidebar-link">
                <ChevronRight size={14} /> Browse Scholarships
              </a>
              <a href="/dashboard" class="sidebar-link">
                <ChevronRight size={14} /> My Dashboard
              </a>
              <a href="/pricing" class="sidebar-link">
                <ChevronRight size={14} /> Pricing
              </a>
            </nav>
          </div>
        </aside>
      </div>
    {/if}

  </div>
</section>

<style>
  /* ── Header ── */
  .blog-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 5rem 1.5rem 3.5rem;
    text-align: center;
  }
  .blog-header-inner {
    max-width: 600px;
    margin: 0 auto;
  }
  .eyebrow {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #f97316;
    margin-bottom: 0.75rem;
  }
  .blog-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(2rem, 5vw, 2.8rem);
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    margin-bottom: 0.75rem;
    line-height: 1.1;
  }
  .blog-subtitle {
    font-size: 1.05rem;
    color: #475569;
    line-height: 1.7;
    margin-bottom: 2rem;
  }

  /* ── Search ── */
  .search-form {
    max-width: 480px;
    margin: 0 auto;
  }
  .search-bar {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 100px;
    padding: 0.35rem 0.4rem 0.35rem 1.1rem;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
    gap: 0.5rem;
  }
  :global(.search-icon) {
    color: #94a3b8;
    flex-shrink: 0;
  }
  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.92rem;
    color: #0f172a;
    min-width: 0;
  }
  .search-input::placeholder {
    color: #94a3b8;
  }
  .search-btn {
    padding: 0.6rem 1.25rem;
    background: #f97316;
    color: white;
    border: none;
    border-radius: 100px;
    font-weight: 600;
    font-size: 0.88rem;
    white-space: nowrap;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .search-btn:hover {
    background: #ea580c;
  }

  /* ── Body ── */
  .blog-body {
    background: #f8fafc;
    min-height: 60vh;
    padding: 3rem 0 5rem;
  }
  .blog-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* ── Search result bar ── */
  .search-result-bar {
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    color: #475569;
  }
  .clear-search {
    margin-left: 0.75rem;
    color: #f97316;
    text-decoration: none;
    font-weight: 600;
  }
  .clear-search:hover {
    text-decoration: underline;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 5rem 1rem;
  }
  .empty-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #94a3b8;
    margin-bottom: 1.25rem;
  }
  .empty-state h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }
  .empty-state p {
    font-size: 0.95rem;
    color: #64748b;
  }

  /* ── Layout ── */
  .posts-layout {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 2.5rem;
    align-items: start;
  }
  .posts-grid-wrap {
    min-width: 0;
  }
  .posts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  /* ── Post card ── */
  .post-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    overflow: hidden;
    transition: transform 0.22s, box-shadow 0.22s;
    display: flex;
    flex-direction: column;
  }
  .post-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
  }
  .post-thumb {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f1f5f9;
  }
  .post-thumb-fallback {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }
  .post-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .post-card:hover .post-thumb-img {
    transform: scale(1.04);
  }
  .post-body {
    padding: 1.25rem 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .post-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: #64748b;
    margin-bottom: 0.6rem;
  }
  .post-meta-dot {
    color: #cbd5e1;
  }
  .post-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.4;
    margin-bottom: 0.6rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .post-title a {
    text-decoration: none;
    color: inherit;
    transition: color 0.15s;
  }
  .post-title a:hover {
    color: #f97316;
  }
  .post-excerpt {
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.65;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }
  .post-read-more {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.84rem;
    font-weight: 600;
    color: #f97316;
    text-decoration: none;
    transition: gap 0.15s;
    margin-top: auto;
  }
  .post-read-more:hover {
    gap: 0.45rem;
  }

  /* ── Pagination ── */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 3rem;
    flex-wrap: wrap;
  }
  .page-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 0.5rem;
    border: none;
    background: white;
    border: 1px solid #e2e8f0;
    font-size: 0.875rem;
    color: #475569;
    font-weight: 500;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .page-btn:hover {
    color: #f97316;
    border-color: #f97316;
  }
  .page-btn-active {
    background: #f97316;
    color: white;
    border-color: #f97316;
    font-weight: 700;
  }
  .page-btn-active:hover {
    background: #f97316;
    color: white;
  }
  .page-btn-nav {
    padding: 0.5rem 1rem;
  }
  .page-ellipsis {
    padding: 0.5rem 0.4rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  /* ── Sidebar ── */
  .sidebar {
    position: sticky;
    top: 5.5rem;
  }
  .sidebar-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    padding: 1.5rem;
  }
  .sidebar-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 1rem;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    color: #475569;
    text-decoration: none;
    padding: 0.45rem 0.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: color 0.15s, background 0.15s;
  }
  .sidebar-link:hover {
    color: #f97316;
    background: #fff7ed;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .posts-layout {
      grid-template-columns: 1fr;
    }
    .sidebar {
      position: static;
    }
  }
  @media (max-width: 600px) {
    .posts-grid {
      grid-template-columns: 1fr;
    }
    .blog-header {
      padding: 4rem 1rem 2.5rem;
    }
  }
</style>
