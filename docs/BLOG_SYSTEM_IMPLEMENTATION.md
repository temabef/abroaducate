## Blog System Implementation Plan (Abroaducate)

### Context and Fit
- **Stack**: SvelteKit frontend, Supabase auth/DB/storage, Vercel hosting.
- **Admin**: Central role check via `public.is_admin()`; RLS widely used.
- **SEO**: `src/lib/components/SEO.svelte` and sitemap route are available.
- **Redirects**: `vercel.json` currently redirects `/blog/:slug*` → `/` (must be removed to enable blog routes).

### Phase 0 — Prerequisites and Decisions
- **Permissions**: Use `public.is_admin()` for all CMS writes; public reads for published posts only.
- **Content format**: Author in Markdown with live preview; sanitize when rendering.
- **Media**: Supabase Storage bucket `blog` (public read, admin write).
- **Routing**: Add `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`, `/blog/rss.xml`.
- **SEO**: Use `SEO.svelte` with `schemaType="Article"` and extend `sitemap.xml` to include posts.
- **Analytics**: Track views and read completion using existing analytics utils.

### Phase 1 — Data Model and Security (Supabase)
- **Tables** (fields are indicative; adjust as needed):
  - **`blog_posts`**: `id uuid`, `slug text unique`, `title`, `excerpt`, `content_md text`, `cover_image_url`, `author_user_id uuid`, `status text` (`draft|scheduled|published|archived`), `published_at timestamptz`, `reading_time int`, `seo_title`, `seo_description`, `canonical_url`, `og_image_url`, timestamps.
  - **`blog_categories`**: `id`, `name`, `slug unique`.
  - **`blog_tags`**: `id`, `name`, `slug unique`.
  - **`blog_post_categories`**: `post_id`, `category_id` (many-to-many) or use single `category_id` on `blog_posts`.
  - **`blog_post_tags`**: `post_id`, `tag_id`.
  - **`blog_revisions`**: `id`, `post_id`, `title_snapshot`, `content_snapshot`, `editor_user_id`, `created_at`.
  - (Optional) **`blog_views`**: `post_id`, `user_id nullable`, `session_id`, `viewed_at`.
- **Indexes**: unique on `blog_posts.slug`; btree on `published_at`; consider FTS index on `content_md` for search.
- **RLS** (enable on all blog tables):
  - `SELECT`: allow when `status='published' AND published_at <= now()` OR `public.is_admin()`.
  - `INSERT/UPDATE/DELETE`: allow only if `public.is_admin()`.
  - Default `author_user_id` to `auth.uid()` on insert (server-side default).
- **Storage**:
  - Create bucket `blog`.
  - Policies: public `read` on `bucket = 'blog'`; admin-only `insert/update/delete` (`public.is_admin()`).
- **Utility functions**:
  - `can_manage_blog()` that returns `public.is_admin()`.
  - (Optional) `generate_unique_slug(base text)`.

### Phase 2 — Public Routes and SEO
- **Remove redirect**: Delete `/blog/:slug*` → `/` rule in `vercel.json`.
- **Routes**:
  - `src/routes/blog/+page.svelte`: list with pagination, filters for category/tag.
  - `src/routes/blog/[slug]/+page.svelte`: render post; SSR load from Supabase; sanitize HTML.
  - `src/routes/blog/category/[slug]/+page.svelte`, `src/routes/blog/tag/[slug]/+page.svelte`.
  - `src/routes/blog/rss.xml/+server.ts`: RSS 2.0 feed; optional `/blog/feed.json`.
- **SEO**:
  - Use `SEO.svelte` on post page with `schemaType="Article"` and OG tags.
  - Extend `src/routes/sitemap.xml/+server.ts` to append latest post URLs using `published_at`.
- **Legacy URLs**:
  - `src/routes/[...slug]/+page.ts` already redirects `YYYY/MM/DD/slug` → `/blog/slug`.

### Phase 3 — Admin CMS (Self-Service)
- **Admin routes**:
  - `src/routes/admin/blog/+page.svelte`: posts table with filters (status/author), search, bulk actions (publish/unpublish/archive).
  - `src/routes/admin/blog/new/+page.svelte`: create post.
  - `src/routes/admin/blog/[id]/+page.svelte`: edit with autosave and revisions.
- **Editor**:
  - Markdown editor + preview; image upload to `blog` bucket; inline image insertion.
- **Features**:
  - Slug generator with uniqueness check; enforce required fields.
  - Status workflow: Draft → Scheduled → Published → Archived.
  - Schedule support via `published_at`; render respects time.
  - SEO fields (title, description, canonical, OG image) in form.
  - Autosave revisions to `blog_revisions`; preview mode (`?preview=1`) for admins only.
- **Guards**:
  - Client: `isUserAdmin()` check.
  - Server: rely on RLS and `public.is_admin()`.

### Phase 4 — Server Endpoints and Search
- Prefer server `+page.server.ts` loads for SSR on public/admin pages.
- Optional REST-style endpoints under `src/routes/api/blog/*` if client access is needed.
- Search:
  - MVP: `ilike` on title/excerpt.
  - Advanced: PostgreSQL full-text search on `content_md` with ranking.
- Caching: set `Cache-Control` headers on public endpoints and RSS; revalidate on publish/edit.
- Security: sanitize rendered HTML from Markdown.

### Phase 5 — Newsletter and Distribution
- On publish, optionally create an announcement in `newsletter_campaigns` with UTM links.
- Provide “Send now / Schedule” actions from the post edit page; respect `newsletter_settings`.

### Phase 6 — Navigation and UX
- Add “Blog” to main nav and footer.
- Add “Featured articles” to homepage (latest 3–6 posts).
- Related posts on post page (by category/tag).
- Reading UX: table of contents (optional), reading time, share buttons.

### Phase 7 — QA, Monitoring, and Performance
- Test: draft/publish/schedule flows, RLS visibility, image upload, SEO tags, RSS validity.
- Performance: pagination, lazy-load images, compress covers.
- Analytics: track `blog_view`, `blog_read_complete`, `blog_share_click`.
- Error handling: friendly 404 for missing slugs; server logs for failures.

### Phase 8 — Launch Checklist
- Remove `/blog` redirect in `vercel.json`.
- Run Supabase migrations (tables, RLS, functions, storage policies).
- Create storage bucket `blog` and upload a default OG image.
- Build admin pages and verify `is_admin()` gating.
- Seed 3–5 posts; verify sitemap & RSS.
- Add menu and homepage sections.
- Deploy and verify public read, admin edit.

### Phase 9 — Post-Launch Enhancements (Optional)
- Comments: `blog_comments` with RLS, or external (Giscus/Disqus).
- `/blog/search` page.
- Embeds: YouTube/Twitter in Markdown.
- Content importers: WordPress WXR importer.
- A/B testing on titles/covers.

### Step-by-Step Setup Checklist (Do in this order)
1. Remove `/blog/:slug*` redirect in `vercel.json` and deploy config changes.
2. In Supabase, create tables: `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_categories`/`category_id`, `blog_post_tags`, `blog_revisions` (and optional `blog_views`).
3. Create indexes (unique slug, `published_at`) and enable RLS with policies described above.
4. Create Storage bucket `blog`; add public read and admin write policies.
5. Implement public routes: `/blog`, `/blog/[slug]`, category/tag pages, RSS.
6. Wire SEO via `SEO.svelte` (`schemaType="Article"`); extend `sitemap.xml` to include posts.
7. Build Admin CMS pages under `src/routes/admin/blog/*` with Markdown editor, image upload, SEO fields, status workflow, revisions, preview.
8. Optional: connect newsletter creation on publish via existing `newsletter_*` tables.
9. Add analytics tracking for views and read completion.
10. QA: verify RLS, visibility, SEO, RSS, performance; seed content; add nav; deploy.

### Ownership & Permissions Summary
- All blog writes (DB and Storage) require `public.is_admin()`.
- Public can select only posts where `status='published' AND published_at <= now()`.
- Storage bucket `blog`: public read; admin-only write/delete.

### Known Blockers / Required Changes
- `vercel.json` contains a rule that redirects `/blog/:slug*` to `/`. Remove this rule to enable blog routes.

### File Map to Add (Scaffold)
- `src/routes/blog/+page.svelte`
- `src/routes/blog/[slug]/+page.svelte`
- `src/routes/blog/category/[slug]/+page.svelte`
- `src/routes/blog/tag/[slug]/+page.svelte`
- `src/routes/blog/rss.xml/+server.ts`
- `src/routes/admin/blog/+page.svelte`
- `src/routes/admin/blog/new/+page.svelte`
- `src/routes/admin/blog/[id]/+page.svelte`

### Notes
- Keep Markdown rendering sanitized to prevent XSS.
- Prefer SSR loads for SEO; add reasonable cache headers.
- Use backfills/seed scripts for initial content.



