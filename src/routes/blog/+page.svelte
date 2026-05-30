<script lang="ts">
  import type { PageData } from './$types';
  import SEO from '$lib/components/SEO.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { Search, ChevronRight, BookOpen, Clock, Calendar, Sparkles, Mail, Compass, Star } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  const posts = $derived(data.posts);
  const total = $derived(data.total);
  const page = $derived(data.page);
  const pageSize = $derived(data.pageSize);
  const search = $derived(data.search);
  const totalPages = $derived(data.totalPages);

  let searchQuery = $state('');

  // --- Newsletter subscribe state ---
  let newsletterEmail = $state('');
  let newsletterLoading = $state(false);
  let newsletterSuccess = $state(false);
  let newsletterError = $state('');
  let newsletterMessage = $state('');

  async function handleNewsletterSubmit(e: SubmitEvent) {
    e.preventDefault();
    newsletterError = '';
    newsletterMessage = '';

    const email = newsletterEmail.trim();
    if (!email) {
      newsletterError = 'Please enter your email address.';
      return;
    }

    newsletterLoading = true;
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog_inline_widget' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        newsletterError = data.error || 'Something went wrong. Please try again.';
      } else {
        newsletterSuccess = true;
        newsletterMessage = data.message;
        newsletterEmail = '';
      }
    } catch {
      newsletterError = 'Connection error. Please check your internet and try again.';
    } finally {
      newsletterLoading = false;
    }
  }

  // Extract featured post (first post, only on page 1 and when no search query is active)
  const featuredPost = $derived(page === 1 && !search && posts.length > 0 ? posts[0] : null);
  const gridPosts = $derived(page === 1 && !search && posts.length > 0 ? posts.slice(1) : posts);

  // Categories list mapped to search text
  const categories = [
    { label: 'All Guides', value: '' },
    { label: 'Scholarships', value: 'scholarship' },
    { label: 'Germany', value: 'germany' },
    { label: 'Application SOPs', value: 'application' },
    { label: 'Fee Waivers', value: 'fee waiver' }
  ];

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
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<SEO
  title="Blog — Study Abroad Insights"
  description="Expert guides, tips, and insights for your study abroad journey. From university applications to scholarship opportunities."
  schemaType="WebPage"
/>

<!-- Premium Header -->
<section class="blog-header">
  <div class="blog-header-inner">
    <div class="eyebrow-container">
      <span class="eyebrow-accent"></span>
      <span class="eyebrow">ABROADUCATE PLATFORM INSIGHTS</span>
      <span class="eyebrow-accent"></span>
    </div>
    <h1 class="blog-title">Study Abroad Insights</h1>
    <p class="blog-subtitle">Expert-crafted strategies, program guides, and scholarship blueprints to fund your international education.</p>

    <!-- Search Bar -->
    <form onsubmit={handleSearch} class="search-form">
      <div class="search-bar">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search scholarship guides, visa rules, SOP templates..."
          class="search-input"
        />
        <button type="submit" class="search-btn" aria-label="Search articles">
          Search
        </button>
      </div>
    </form>

    <!-- Category Pills -->
    <div class="category-pills-wrapper">
      <div class="category-pills">
        {#each categories as cat}
          <a
            href={cat.value ? `/blog?search=${encodeURIComponent(cat.value)}` : '/blog'}
            class="category-pill"
            class:active={(cat.value === '' && !search) || (cat.value !== '' && search?.toLowerCase().includes(cat.value.toLowerCase()))}
          >
            {cat.label}
          </a>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Main Container -->
<section class="blog-body">
  <div class="blog-container">

    {#if search}
      <div class="search-result-bar">
        <p>
          Showing {total > 0 ? `${total} article${total === 1 ? '' : 's'}` : '0 articles'} matching "<strong>{search}</strong>"
          <a href="/blog" class="clear-search">View all articles</a>
        </p>
      </div>
    {/if}

    {#if posts.length === 0}
      <!-- Empty state -->
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <BookOpen size={28} />
        </div>
        <h2>No articles found</h2>
        <p>We couldn't find anything matching your search. Try another category or search parameter.</p>
        <a href="/blog" class="empty-reset-btn">Reset Search</a>
      </div>
    {:else}
      <!-- Featured Post (Wide Hero layout) -->
      {#if featuredPost}
        <div class="featured-section">
          <div class="featured-header">
            <span class="featured-badge">
              <Sparkles size={12} class="featured-badge-icon" /> RECOMMENDED GUIDE
            </span>
          </div>
          <article class="featured-card">
            {#if featuredPost.thumbnail_url}
              <div class="featured-thumb">
                <img
                  src={featuredPost.thumbnail_url}
                  alt={featuredPost.title}
                  class="featured-thumb-img"
                />
              </div>
            {:else}
              <div class="featured-thumb featured-thumb-fallback"></div>
            {/if}

            <div class="featured-body">
              <div class="post-meta">
                <span class="post-meta-item">
                  <Calendar size={13} /> {formatDate(featuredPost.published_at)}
                </span>
                <span class="post-meta-dot">&middot;</span>
                <span class="post-meta-item">
                  <Clock size={13} /> {featuredPost.reading_time} min read
                </span>
              </div>

              <h2 class="featured-title">
                <a href="/blog/{featuredPost.slug}">{featuredPost.title}</a>
              </h2>

              {#if featuredPost.excerpt}
                <p class="featured-excerpt">{featuredPost.excerpt}</p>
              {/if}

              <div class="featured-footer">
                <a href="/blog/{featuredPost.slug}" class="featured-read-btn">
                  Read Premium Article <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </article>
        </div>
      {/if}

      <div class="posts-layout">
        <!-- Posts grid -->
        <div class="posts-grid-wrap">
          <div class="posts-grid">
            {#each gridPosts as post, idx}
              <!-- Inline subscription block injected gracefully at index 2 (card position 3) -->
              {#if idx === 2 && page === 1}
                <div class="post-card cta-inline-card">
                  <div class="cta-card-inner">
                    <div class="cta-icon-wrap">
                      <Mail size={20} class="cta-icon" />
                    </div>
                    <span class="cta-eyebrow">SCHOLARSHIP RADAR ALERTS</span>
                    <h3 class="cta-title">Join 50k+ study abroad leaders</h3>
                    <p class="cta-text">Get visa updates, deadline reminders, and tuition-free opportunities sent directly to your inbox weekly.</p>
                    {#if newsletterSuccess}
                      <div class="cta-success">
                        <span class="cta-success-icon">✓</span>
                        <p class="cta-success-msg">{newsletterMessage}</p>
                        <button class="cta-reset-btn" onclick={() => { newsletterSuccess = false; }}>Subscribe another email</button>
                      </div>
                    {:else}
                      <form class="cta-form" onsubmit={handleNewsletterSubmit}>
                        <input
                          id="newsletter-email-inline"
                          type="email"
                          placeholder="Your primary email address"
                          required
                          class="cta-input"
                          bind:value={newsletterEmail}
                          disabled={newsletterLoading}
                        />
                        <button type="submit" class="cta-btn" disabled={newsletterLoading}>
                          {newsletterLoading ? 'Joining…' : 'Join Alerts'}
                        </button>
                      </form>
                      {#if newsletterError}
                        <p class="cta-error">{newsletterError}</p>
                      {/if}
                    {/if}
                  </div>
                </div>
              {/if}

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
                    <span class="post-meta-item"><Calendar size={12} /> {formatDate(post.published_at)}</span>
                    <span class="post-meta-dot">&middot;</span>
                    <span class="post-meta-item"><Clock size={12} /> {post.reading_time} min read</span>
                  </div>

                  <h2 class="post-title">
                    <a href="/blog/{post.slug}">{post.title}</a>
                  </h2>

                  {#if post.excerpt}
                    <p class="post-excerpt">{post.excerpt}</p>
                  {/if}

                  <a href="/blog/{post.slug}" class="post-read-more">
                    Read article <ChevronRight size={14} />
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

        <!-- Dynamic Sidebar -->
        <aside class="sidebar">
          
          <!-- Explore platform tools -->
          <div class="sidebar-card">
            <h3 class="sidebar-title">
              <Compass size={14} class="sidebar-title-icon" /> EXPLORE PLATFORM
            </h3>
            <nav class="sidebar-nav">
              <a href="/programs" class="sidebar-link">
                <span class="sidebar-link-bullet"></span> Find Programs
                <ChevronRight size={13} class="sidebar-link-arrow" />
              </a>
              <a href="/scholarships" class="sidebar-link">
                <span class="sidebar-link-bullet"></span> Browse Scholarships
                <ChevronRight size={13} class="sidebar-link-arrow" />
              </a>
              <a href="/dashboard" class="sidebar-link">
                <span class="sidebar-link-bullet"></span> My Dashboard
                <ChevronRight size={13} class="sidebar-link-arrow" />
              </a>
              <a href="/pricing" class="sidebar-link">
                <span class="sidebar-link-bullet"></span> View Pricing
                <ChevronRight size={13} class="sidebar-link-arrow" />
              </a>
            </nav>
          </div>

          <!-- Dynamic Copilot CTA Card -->
          <div class="sidebar-card sidebar-accent-card">
            <div class="sidebar-accent-icon-wrap">
              <Sparkles size={18} class="accent-icon" />
            </div>
            <h4 class="accent-card-title">AI Application Copilot</h4>
            <p class="accent-card-text">Struggling with your Statement of Purpose (SOP) or Europass CV? Our expert-calibrated AI drafts flawless copies in under 2 minutes.</p>
            <a href="/copilot" class="accent-card-btn">
              Build Document Now <Star size={13} class="accent-btn-star" />
            </a>
          </div>

        </aside>
      </div>
    {/if}

  </div>
</section>

<style>
  /* ── Design Tokens (Theme Variables) ── */
  :root {
    --primary: 24 95% 53%; /* HSL Orange */
    --primary-hover: 20 96% 48%;
    --text-main: 222 47% 11%; /* HSL Charcoal */
    --text-muted: 215 16% 47%;
    --bg-base: 210 40% 98%;
    --bg-card: 0 0% 100%;
    --border-color: 220 14% 90%;
    --accent-gold: 45 90% 48%;
  }

  /* ── Header ── */
  .blog-header {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid hsl(var(--border-color));
    padding: 6rem 1.5rem 4rem;
    text-align: center;
  }
  .blog-header-inner {
    max-width: 720px;
    margin: 0 auto;
  }
  .eyebrow-container {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
  .eyebrow-accent {
    width: 6px;
    height: 6px;
    background-color: hsl(var(--primary));
    border-radius: 50%;
  }
  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(var(--primary));
  }
  .blog-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(2.2rem, 6vw, 3.2rem);
    font-weight: 800;
    color: hsl(var(--text-main));
    letter-spacing: -0.03em;
    margin-bottom: 0.85rem;
    line-height: 1.1;
  }
  .blog-subtitle {
    font-size: 1.1rem;
    color: hsl(var(--text-muted));
    line-height: 1.6;
    margin-bottom: 2.25rem;
  }

  /* ── Search ── */
  .search-form {
    max-width: 520px;
    margin: 0 auto 2rem;
  }
  .search-bar {
    display: flex;
    align-items: center;
    background: hsl(var(--bg-card));
    border: 1px solid hsl(var(--border-color));
    border-radius: 100px;
    padding: 0.35rem 0.4rem 0.35rem 1.25rem;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    gap: 0.6rem;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .search-bar:focus-within {
    border-color: hsl(var(--primary));
    box-shadow: 0 4px 24px rgba(249, 115, 22, 0.08);
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
    font-size: 0.95rem;
    color: hsl(var(--text-main));
    min-width: 0;
  }
  .search-input::placeholder {
    color: #94a3b8;
  }
  .search-btn {
    padding: 0.65rem 1.4rem;
    background: hsl(var(--primary));
    color: white;
    border: none;
    border-radius: 100px;
    font-weight: 600;
    font-size: 0.88rem;
    white-space: nowrap;
    transition: background 0.2s, transform 0.15s;
    cursor: pointer;
    flex-shrink: 0;
  }
  .search-btn:hover {
    background: hsl(var(--primary-hover));
  }
  .search-btn:active {
    transform: scale(0.97);
  }

  /* ── Category Pills ── */
  .category-pills-wrapper {
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 auto;
    padding: 0.25rem;
  }
  .category-pills-wrapper::-webkit-scrollbar {
    display: none;
  }
  .category-pills {
    display: inline-flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.1rem;
  }
  .category-pill {
    padding: 0.5rem 1.1rem;
    border-radius: 100px;
    background: hsl(var(--bg-card));
    border: 1px solid hsl(var(--border-color));
    font-size: 0.82rem;
    font-weight: 600;
    color: hsl(var(--text-muted));
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.02);
    transition: all 0.2s ease-in-out;
  }
  .category-pill:hover {
    border-color: hsl(var(--primary));
    color: hsl(var(--primary));
    background: hsla(24, 95%, 53%, 0.02);
  }
  .category-pill.active {
    background: hsl(var(--primary));
    border-color: hsl(var(--primary));
    color: white;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
  }

  /* ── Body ── */
  .blog-body {
    background: #f8fafc;
    min-height: 60vh;
    padding: 4rem 0 6rem;
  }
  .blog-container {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* ── Search result bar ── */
  .search-result-bar {
    margin-bottom: 2rem;
    font-size: 0.95rem;
    color: hsl(var(--text-muted));
  }
  .clear-search {
    margin-left: 0.75rem;
    color: hsl(var(--primary));
    text-decoration: none;
    font-weight: 600;
  }
  .clear-search:hover {
    text-decoration: underline;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 6rem 1.5rem;
    background: white;
    border: 1px solid hsl(var(--border-color));
    border-radius: 1.25rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  .empty-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #fff7ed;
    color: hsl(var(--primary));
    margin-bottom: 1.5rem;
  }
  .empty-state h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    font-weight: 750;
    color: hsl(var(--text-main));
    margin-bottom: 0.6rem;
  }
  .empty-state p {
    font-size: 0.98rem;
    color: hsl(var(--text-muted));
    margin-bottom: 1.75rem;
  }
  .empty-reset-btn {
    display: inline-block;
    padding: 0.65rem 1.5rem;
    background: hsl(var(--primary));
    color: white;
    font-weight: 600;
    border-radius: 100px;
    text-decoration: none;
    transition: background 0.2s;
  }
  .empty-reset-btn:hover {
    background: hsl(var(--primary-hover));
  }

  /* ── Featured Section ── */
  .featured-section {
    margin-bottom: 4rem;
  }
  .featured-header {
    margin-bottom: 0.85rem;
  }
  .featured-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 800;
    color: hsl(var(--accent-gold));
    letter-spacing: 0.08em;
    background: #fef3c7;
    padding: 0.35rem 0.75rem;
    border-radius: 100px;
    border: 1px solid #fde68a;
  }
  .featured-badge-icon {
    flex-shrink: 0;
  }
  .featured-card {
    display: grid;
    grid-template-columns: 52% 48%;
    background: hsl(var(--bg-card));
    border: 1px solid hsl(var(--border-color));
    border-radius: 1.5rem;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(15, 23, 42, 0.03);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .featured-card:hover {
    transform: translateY(-4px);
    border-color: hsla(var(--primary), 0.25);
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.07);
  }
  .featured-thumb {
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: #f1f5f9;
  }
  .featured-thumb-fallback {
    background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  }
  .featured-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  .featured-card:hover .featured-thumb-img {
    transform: scale(1.03);
  }
  .featured-body {
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .featured-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.4rem, 3.5vw, 1.8rem);
    font-weight: 800;
    color: hsl(var(--text-main));
    line-height: 1.35;
    margin-bottom: 0.85rem;
    letter-spacing: -0.02em;
  }
  .featured-title a {
    text-decoration: none;
    color: inherit;
    transition: color 0.15s;
  }
  .featured-title a:hover {
    color: hsl(var(--primary));
  }
  .featured-excerpt {
    font-size: 0.94rem;
    color: hsl(var(--text-muted));
    line-height: 1.65;
    margin-bottom: 1.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .featured-read-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem 1.6rem;
    background: hsl(var(--text-main));
    color: white;
    font-weight: 600;
    font-size: 0.88rem;
    text-decoration: none;
    border-radius: 100px;
    transition: background 0.2s, gap 0.2s;
  }
  .featured-read-btn:hover {
    background: hsl(var(--primary));
    gap: 0.6rem;
  }

  /* ── Layout Grid ── */
  .posts-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 3rem;
    align-items: start;
  }
  .posts-grid-wrap {
    min-width: 0;
  }
  .posts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.75rem;
  }

  /* ── Standard Post Card ── */
  .post-card {
    background: hsl(var(--bg-card));
    border: 1px solid hsl(var(--border-color));
    border-radius: 1.25rem;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);
  }
  .post-card:hover {
    transform: translateY(-4px);
    border-color: hsla(var(--primary), 0.2);
    box-shadow: 0 10px 32px rgba(15, 23, 42, 0.06);
  }
  .post-thumb {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f8fafc;
  }
  .post-thumb-fallback {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }
  .post-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .post-card:hover .post-thumb-img {
    transform: scale(1.03);
  }
  .post-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .post-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: hsl(var(--text-muted));
    margin-bottom: 0.75rem;
  }
  .post-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .post-meta-dot {
    color: #cbd5e1;
  }
  .post-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.05rem;
    font-weight: 750;
    color: hsl(var(--text-main));
    line-height: 1.45;
    margin-bottom: 0.7rem;
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
    color: hsl(var(--primary));
  }
  .post-excerpt {
    font-size: 0.88rem;
    color: hsl(var(--text-muted));
    line-height: 1.6;
    margin-bottom: 1.25rem;
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
    gap: 0.2rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: hsl(var(--primary));
    text-decoration: none;
    transition: gap 0.15s;
    margin-top: auto;
    padding-top: 0.5rem;
    align-self: flex-start;
  }
  .post-read-more:hover {
    gap: 0.4rem;
  }

  /* ── Inline Lead Capture Card ── */
  .cta-inline-card {
    background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
    border: 1px solid #fed7aa;
    text-align: center;
  }
  .cta-inline-card:hover {
    border-color: #fdba74;
    box-shadow: 0 10px 32px rgba(249, 115, 22, 0.05);
  }
  .cta-card-inner {
    padding: 1.75rem 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .cta-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: #ffedd5;
    border-radius: 50%;
    color: hsl(var(--primary));
    margin-bottom: 0.85rem;
  }
  .cta-eyebrow {
    font-size: 0.68rem;
    font-weight: 800;
    color: hsl(var(--primary));
    letter-spacing: 0.1em;
    margin-bottom: 0.4rem;
  }
  .cta-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.1rem;
    font-weight: 800;
    color: hsl(var(--text-main));
    line-height: 1.3;
    margin-bottom: 0.5rem;
  }
  .cta-text {
    font-size: 0.8rem;
    color: hsl(var(--text-muted));
    line-height: 1.55;
    margin-bottom: 1.25rem;
  }
  .cta-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cta-input {
    width: 100%;
    padding: 0.6rem 1rem;
    border: 1px solid #ffedd5;
    border-radius: 100px;
    font-size: 0.82rem;
    background: white;
    outline: none;
    text-align: center;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
  }
  .cta-input:focus {
    border-color: hsl(var(--primary));
  }
  .cta-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    background: hsl(var(--text-main));
    color: white;
    font-weight: 700;
    font-size: 0.82rem;
    border: none;
    border-radius: 100px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cta-btn:hover {
    background: hsl(var(--primary));
  }
  .cta-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  .cta-input:disabled {
    opacity: 0.6;
    background: #f9f9f9;
  }
  .cta-error {
    font-size: 0.78rem;
    color: #dc2626;
    text-align: center;
    margin-top: 0.35rem;
    animation: fadeIn 0.2s ease;
  }
  /* Success state */
  .cta-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    animation: fadeIn 0.3s ease;
  }
  .cta-success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: hsl(142, 70%, 45%);
    color: white;
    font-size: 1.2rem;
    font-weight: 800;
    flex-shrink: 0;
  }
  .cta-success-msg {
    font-size: 0.83rem;
    color: hsl(var(--text-main));
    text-align: center;
    line-height: 1.5;
    font-weight: 600;
  }
  .cta-reset-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: hsl(var(--text-muted));
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    margin-top: 0.15rem;
  }
  .cta-reset-btn:hover {
    color: hsl(var(--primary));
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Pagination ── */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 3.5rem;
    flex-wrap: wrap;
  }
  .page-btn {
    padding: 0.55rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid hsl(var(--border-color));
    background: white;
    font-size: 0.875rem;
    color: hsl(var(--text-muted));
    font-weight: 600;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .page-btn:hover {
    color: hsl(var(--primary));
    border-color: hsl(var(--primary));
    background: hsla(24, 95%, 53%, 0.02);
  }
  .page-btn-active {
    background: hsl(var(--primary));
    color: white;
    border-color: hsl(var(--primary));
    cursor: default;
  }
  .page-btn-active:hover {
    background: hsl(var(--primary));
    color: white;
  }
  .page-btn-nav {
    padding: 0.55rem 1.15rem;
  }
  .page-ellipsis {
    padding: 0.55rem 0.5rem;
    color: #cbd5e1;
    font-size: 0.875rem;
  }

  /* ── Sidebar ── */
  .sidebar {
    position: sticky;
    top: 5.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .sidebar-card {
    background: hsl(var(--bg-card));
    border: 1px solid hsl(var(--border-color));
    border-radius: 1.25rem;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.01);
  }
  .sidebar-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .sidebar-title-icon {
    color: #cbd5e1;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    font-size: 0.88rem;
    color: hsl(var(--text-muted));
    text-decoration: none;
    padding: 0.5rem 0.65rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .sidebar-link-bullet {
    width: 5px;
    height: 5px;
    background-color: #cbd5e1;
    border-radius: 50%;
    margin-right: 0.6rem;
    transition: background-color 0.2s, transform 0.2s;
  }
  .sidebar-link-arrow {
    margin-left: auto;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.2s, transform 0.2s;
    color: hsl(var(--primary));
  }
  .sidebar-link:hover {
    color: hsl(var(--primary));
    background: #fff7ed;
  }
  .sidebar-link:hover .sidebar-link-bullet {
    background-color: hsl(var(--primary));
    transform: scale(1.3);
  }
  .sidebar-link:hover .sidebar-link-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  /* ── Accent Sidebar CTA ── */
  .sidebar-accent-card {
    background: linear-gradient(135deg, hsl(var(--text-main)) 0%, #1e293b 100%);
    border: none;
    color: white;
    position: relative;
    overflow: hidden;
  }
  .sidebar-accent-card::before {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(0,0,0,0) 70%);
    border-radius: 50%;
  }
  .sidebar-accent-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: rgba(249, 115, 22, 0.15);
    border-radius: 0.5rem;
    color: #fb923c;
    margin-bottom: 0.85rem;
  }
  .accent-card-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.1rem;
    font-weight: 800;
    color: white;
    margin-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }
  .accent-card-text {
    font-size: 0.82rem;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 1.25rem;
  }
  .accent-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    width: 100%;
    padding: 0.65rem 1rem;
    background: hsl(var(--primary));
    color: white;
    font-weight: 700;
    font-size: 0.82rem;
    text-decoration: none;
    border-radius: 100px;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    transition: all 0.2s ease;
  }
  .accent-card-btn:hover {
    background: hsl(var(--primary-hover));
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35);
    transform: translateY(-1px);
  }
  .accent-btn-star {
    animation: rotatePulse 4s infinite linear;
  }

  @keyframes rotatePulse {
    0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
    50% { transform: scale(1.15) rotate(180deg); opacity: 1; }
    100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
  }

  /* ── Responsive Layout ── */
  @media (max-width: 960px) {
    .featured-card {
      grid-template-columns: 1fr;
    }
    .featured-body {
      padding: 1.75rem;
    }
  }
  @media (max-width: 900px) {
    .posts-layout {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }
    .sidebar {
      position: static;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
  }
  @media (max-width: 650px) {
    .sidebar {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 600px) {
    .posts-grid {
      grid-template-columns: 1fr;
    }
    .blog-header {
      padding: 4.5rem 1rem 2.5rem;
    }
  }
</style>
