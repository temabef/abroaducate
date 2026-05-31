# Abroaducate Platform: Blog Writing & Publishing Standards

This document serves as the official Standard Operating Procedure (SOP) for writing, formatting, managing assets, resolving routes, and injecting blog posts into the Abroaducate blogging system. Use these instructions to ensure consistency, maximize SEO rankings, integrate platform tools, and prevent routing conflicts.

---

## 1. Tone, Style & Platform Integrations

Abroaducate is a premium education-tech platform dedicated to making global study affordable and accessible. The tone of our blog posts must be **authoritative, highly structured, data-driven, and highly encouraging**.

### Internal Tool Integrations
Every blog post should actively promote Abroaducate’s built-in tools to guide readers into high-converting user funnels. Always use the following canonical relative URLs for internal linking:

| Tool / Page | Standard Slug / URL | Purpose |
| :--- | :--- | :--- |
| **Program Finder** | `[Program Finder](/programs)` | Search & filter tuition-free/funded degrees. |
| **Scholarship Radar** | `[Scholarship Matcher](/scholarships)` | Get personalized, national scholarship recommendations. |
| **AI Application Copilot** | `[AI Application Copilot](/copilot)` | Direct access to the complete document builder suite. |
| **Statement of Purpose (SOP) Builder** | `[Statement of Purpose](/sop)` | Refine academic essays and SOP drafts. |
| **Academic CV Builder** | `[Academic CV](/academic-cv)` | Format CVs according to European/Europass guidelines. |
| **Cover Letter Builder** | `[Cover Letters](/cover-letters)` | Draft scholarship and university cover letters. |

---

## 2. Markdown Rendering Engine Specifications

The SvelteKit application uses two distinct server routes to render posts, depending on when they were created. It is critical to write clean Markdown that compiles perfectly on both pathways.

### Formatting Best Practices
- **Headings**: Use exactly one level-1 heading `# Title` at the very top. Subheadings within the text should be structured logically using `## Heading 2` and `### Heading 3`.
- **Bullet Points**: Format lists using `- ` or numbered items (e.g. `1. `). Avoid indentation or custom list symbols since the platform renderer automatically groups consecutive list tags inside structural `<ul>` or `<ol>` elements.
- **Embedded Images**: Embed inline images using standard Markdown syntax:
  ```markdown
  ![Image Caption](https://cloud-image-url.com/asset.png)
  ```
  The renderer will compile this to responsive `<img style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0;" />` elements automatically.

---

## 3. Database Routing Rules & Redirection Architecture

> [!IMPORTANT]  
> **WordPress vs. SvelteKit Route Resolution Conflict**
> To preserve historical SEO rankings and prevent broken links, Abroaducate implements a strict split-routing structure governed by a migration date threshold:
> - **Migration Threshold Date**: `2025-08-17T00:00:00Z`
> - **WordPress Migrated Posts** (`created_at < 2025-08-17`):
>   - They reside at the root level: `/{slug}`.
>   - If a request is sent to `/blog/{slug}`, the server throws a `301 Permanent Redirect` to `/{slug}`.
> - **Normal / SvelteKit Era Posts** (`created_at >= 2025-08-17`):
>   - They reside under the blog prefix: `/blog/{slug}`.
>   - If a request is sent to the root level `/{slug}`, the server throws a `301 Permanent Redirect` to `/blog/{slug}`.

### Publishing Rule for New Posts
When creating and injecting a new post, **always ensure the `created_at` timestamp is set to the current date and time (or any timestamp after August 17, 2025)**. This guarantees that SvelteKit recognizes it as a standard platform-era article and serves it correctly under the `/blog/` namespace without trigger-loop redirections.

---

## 4. Static Assets & Media Hosting Workflow

To maximize CDN cache hits and ensure cross-platform compatibility (especially when deploying to serverless platforms like Vercel), Abroaducate does not host heavy blog assets directly from local storage.

### Standard Asset Workflow
1. **Asset Generation**: Use an AI image generation model to generate custom cover artwork and high-fidelity infographics.
2. **Local Staging**: Save the draft asset locally to the project's `/static` directory (e.g., `/static/blog_cover_art.png`). During local development, this image is publicly available at `http://localhost:5173/blog_cover_art.png`.
3. **Cloud Upload**: Copy the asset from the `/static` folder and upload it to an external hosting service (e.g. ImgBB or Amazon S3 bucket) to secure a persistent HTTPS direct URL.
4. **Database Injection**: Use the secure cloud direct link as the `cover_image_url` property inside your database payload.

---

## 5. Programmatic Injection Script Template

To publish or update a blog post programmatically, create a Node.js script using the `@supabase/supabase-js` client. This avoids manual database tampering and validates payload integrity.

### Standard Injection Script (`insert_post.js`)

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const title = 'Your Blog Post Title';
const slug = 'your-blog-post-slug';
const excerpt = 'A compelling meta description/excerpt for SEO indexing.';
const cover_image_url = process.argv[2] || '/default_local_image.png'; // Accept cloud URL as CLI argument

async function publish() {
  try {
    const content = fs.readFileSync('./your_post_draft.md', 'utf8');

    // Retrieve first admin user to assign as post author
    const { data: userData } = await supabase.auth.admin.listUsers({ limit: 1 });
    const authorId = userData?.users?.[0]?.id || null;

    const payload = {
      title,
      slug,
      excerpt,
      content,
      cover_image_url,
      status: 'published',
      published_at: new Date().toISOString(),
      author_user_id: authorId,
      created_at: new Date().toISOString(), // Vital: Ensures SvelteKit /blog/ routing is preserved
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error uploading blog post:", error.message);
      process.exit(1);
    }

    console.log(`✨ SUCCESS! Blog post uploaded. Route: /blog/${data.slug}`);
  } catch (err) {
    console.error("❌ Exception during publication:", err.message);
  }
}

publish();
```

To run this script:
```bash
# To test with a local staged asset
node insert_post.js

# To inject the final live cloud asset
node insert_post.js "https://i.ibb.co/direct-cloud-link/your-cover-image.png"
```
