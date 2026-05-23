<script lang="ts">
  import type { PageData } from './$types';
  import SEO from '$lib/components/SEO.svelte';
  import { Twitter, Linkedin, Link2, ChevronRight, Calendar, Clock } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
  const { post, html, related } = data;

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
  }
</script>

<SEO
  title={post.title}
  description={post.excerpt || `Read ${post.title} on our study abroad blog`}
  image={post.cover_image_url}
  schemaType="Article"
/>

<article class="post-article">

  <!-- Hero -->
  {#if post.cover_image_url}
    <div class="hero-image mt-16">
      <img
        src={post.cover_image_url}
        alt={post.title}
        class="hero-img"
        loading="eager"
        onerror={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          img.style.display = 'none';
          const overlay = img.nextElementSibling as HTMLElement | null;
          if (overlay) overlay.style.display = 'none';
        }}
      />
      <div class="hero-overlay"></div>
      <div class="hero-text-wrap">
        <div class="hero-text-inner">
          <h1 class="hero-title">{post.title}</h1>
          <div class="hero-meta">
            <span class="hero-meta-item">
              <Calendar size={15} />
              <time>{formatDate(post.published_at)}</time>
            </span>
            <span class="hero-meta-item">
              <Clock size={15} />
              {post.reading_time} min read
            </span>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="hero-text-only">
      <div class="hero-text-only-inner">
        <h1 class="hero-title-dark">{post.title}</h1>
        <div class="hero-meta-dark">
          <span class="hero-meta-item-dark">
            <Calendar size={16} />
            <time>{formatDate(post.published_at)}</time>
          </span>
          <span class="hero-meta-item-dark">
            <Clock size={16} />
            {post.reading_time} min read
          </span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content area -->
  <div class="content-wrap">
    <div class="content-inner">
      <div class="content-grid">
        <!-- Main content -->
        <div class="main-col">

          {#if post.excerpt}
            <div class="excerpt-block">
              <p>{post.excerpt}</p>
            </div>
          {/if}

          <div class="prose prose-lg max-w-none">
            {@html html}
          </div>

          <!-- Share -->
          <div class="share-section">
            <h3 class="share-title">Share this article</h3>
            <div class="share-buttons">
              <button onclick={shareOnTwitter} class="share-btn" aria-label="Share on Twitter">
                <Twitter size={16} />
              </button>
              <button onclick={shareOnLinkedIn} class="share-btn" aria-label="Share on LinkedIn">
                <Linkedin size={16} />
              </button>
              <button onclick={copyLink} class="share-btn" aria-label="Copy link">
                <Link2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="sidebar-col">
          <div class="sidebar-card">
            <h3 class="sidebar-heading">Navigation</h3>
            <nav class="sidebar-nav">
              <a href="/blog" class="sidebar-link sidebar-link-back">
                &larr; Back to Blog
              </a>
              <a href="/programs" class="sidebar-link">
                <ChevronRight size={13} /> Find Programs
              </a>
              <a href="/scholarships" class="sidebar-link">
                <ChevronRight size={13} /> Browse Scholarships
              </a>
              <a href="/dashboard" class="sidebar-link">
                <ChevronRight size={13} /> My Dashboard
              </a>
            </nav>
          </div>
        </aside>

      </div>
    </div>
  </div>

  <!-- Related Posts -->
  {#if related && related.length > 0}
    <div class="related-section">
      <div class="related-inner">
        <h2 class="related-title">Related Articles</h2>
        <div class="related-grid" style="--count: {related.length}">
          {#each related as rp}
            <a href="/blog/{rp.slug}" class="related-card">
              {#if rp.thumbnail_url}
                <div class="related-thumb">
                  <img
                    src={rp.thumbnail_url}
                    alt={rp.title}
                    class="related-thumb-img"
                    onerror={(e) => {
                      const t = e.target as HTMLImageElement;
                      if (t && t.parentElement) {
                        t.style.display = 'none';
                        t.parentElement.classList.add('related-thumb-fallback');
                      }
                    }}
                  />
                </div>
              {:else}
                <div class="related-thumb related-thumb-fallback"></div>
              {/if}
              <div class="related-body">
                <div class="related-meta">
                  <time>{formatDate(rp.published_at)}</time>
                  <span>&middot;</span>
                  <span>{rp.reading_time} min read</span>
                </div>
                <h3 class="related-post-title">{rp.title}</h3>
                {#if rp.excerpt}
                  <p class="related-excerpt">{rp.excerpt}</p>
                {/if}
                <span class="related-read-more">Read more <ChevronRight size={13} /></span>
              </div>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/if}

</article>

<style>
  .post-article {
    background: white;
  }

  /* ── Hero with image ── */
  .hero-image {
    position: relative;
    height: 18rem;
    overflow: hidden;
    background: #0f172a;
  }
  @media (min-width: 640px) {
    .hero-image { height: 24rem; }
  }
  .hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 10%;
    display: block;
  }
  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
  }
  .hero-text-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
  }
  .hero-text-inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 1.5rem 2rem;
    width: 100%;
    text-align: center;
  }
  .hero-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.8rem);
    font-weight: 800;
    color: white;
    line-height: 1.2;
    margin-bottom: 0.75rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    letter-spacing: -0.02em;
  }
  .hero-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .hero-meta-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.88);
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }

  /* ── Hero text-only ── */
  .hero-text-only {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding-top: 6rem;
    padding-bottom: 3rem;
  }
  .hero-text-only-inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 1.5rem;
    text-align: center;
  }
  .hero-title-dark {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
    margin-bottom: 1rem;
    letter-spacing: -0.03em;
  }
  .hero-meta-dark {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .hero-meta-item-dark {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    color: #64748b;
  }

  /* ── Content ── */
  .content-wrap {
    background: #f8fafc;
    padding: 3rem 1.5rem 5rem;
  }
  .content-inner {
    max-width: 72rem;
    margin: 0 auto;
  }
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 3rem;
    align-items: start;
  }
  .main-col {
    min-width: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    padding: 2.5rem;
  }

  /* ── Excerpt ── */
  .excerpt-block {
    border-left: 4px solid #fb923c;
    background: #fff7ed;
    border-radius: 0 0.5rem 0.5rem 0;
    padding: 1rem 1.25rem;
    margin-bottom: 2rem;
  }
  .excerpt-block p {
    font-size: 1.05rem;
    color: #7c2d12;
    font-style: italic;
    line-height: 1.7;
    margin: 0;
  }

  /* ── Prose ── */
  :global(.prose) {
    color: #374151;
    line-height: 1.75;
    overflow: hidden;
  }
  /* Kill any stray resize handles that browsers may render inside rendered HTML */
  :global(.prose *) {
    resize: none !important;
  }
  :global(.prose h1),
  :global(.prose h2),
  :global(.prose h3) {
    font-family: 'Outfit', sans-serif;
    color: #0f172a;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.875rem;
    letter-spacing: -0.02em;
  }
  :global(.prose h1) { font-size: 1.875rem; }
  :global(.prose h2) { font-size: 1.5rem; }
  :global(.prose h3) { font-size: 1.25rem; }
  :global(.prose p) {
    margin-bottom: 1.5rem;
    font-size: 1.0625rem;
  }
  :global(.prose img) {
    width: 100%;
    height: auto;
    border-radius: 0.75rem;
    margin: 2rem 0;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  }
  :global(.prose a) {
    color: #f97316;
    text-decoration: underline;
  }
  :global(.prose a:hover) {
    color: #ea580c;
  }
  :global(.prose strong) {
    font-weight: 600;
    color: #0f172a;
  }
  :global(.prose em) {
    font-style: italic;
  }
  :global(.prose ul),
  :global(.prose ol) {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
    list-style-position: outside;
  }
  :global(.prose ul) {
    list-style-type: disc;
  }
  :global(.prose ol) {
    list-style-type: decimal;
  }
  :global(.prose li) {
    margin-bottom: 0.5rem;
    font-size: 1.0625rem;
    display: list-item;
    appearance: none;
    -webkit-appearance: none;
    overflow: visible;
    resize: none;
  }
  :global(.prose li::marker) {
    color: #94a3b8;
  }
  /* Prevent any stray resize handles inside prose */
  :global(.prose *) {
    resize: none;
  }

  /* ── Share ── */
  .share-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
  }
  .share-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.875rem;
  }
  .share-buttons {
    display: flex;
    gap: 0.6rem;
  }
  .share-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .share-btn:hover {
    color: #f97316;
    border-color: #f97316;
    background: #fff7ed;
  }

  /* ── Sidebar ── */
  .sidebar-col {
    position: sticky;
    top: 5.5rem;
  }
  .sidebar-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    padding: 1.5rem;
  }
  .sidebar-heading {
    font-family: 'Outfit', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 1rem;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.875rem;
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
  .sidebar-link-back {
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
    padding-left: 0.25rem;
  }
  .sidebar-link-back:hover {
    color: #f97316;
    background: transparent;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
    .sidebar-col {
      position: static;
    }
  }
  @media (max-width: 640px) {
    .main-col {
      padding: 1.5rem;
    }
    .content-wrap {
      padding: 1.5rem 1rem 4rem;
    }
  }

  /* ── Related Posts ── */
  .related-section {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 3.5rem 1.5rem 5rem;
  }
  .related-inner {
    max-width: 72rem;
    margin: 0 auto;
  }
  .related-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 1.75rem;
  }
  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
  }
  .related-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    overflow: hidden;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .related-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }
  .related-thumb {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f1f5f9;
    flex-shrink: 0;
  }
  .related-thumb-fallback {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }
  .related-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .related-card:hover .related-thumb-img {
    transform: scale(1.04);
  }
  .related-body {
    padding: 1rem 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .related-meta {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  .related-post-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.4;
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .related-excerpt {
    font-size: 0.82rem;
    color: #475569;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
    margin-bottom: 0.75rem;
  }
  .related-read-more {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #f97316;
    margin-top: auto;
  }
</style>
