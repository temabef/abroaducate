import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { marked } from 'marked';

export const load: PageServerLoad = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const { slug } = params;

  // Check if this is a WordPress migrated post (created before migration date).
  // Those live at /{slug} (root level), not /blog/{slug}.
  const { data: wordpressPost } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .lt('created_at', '2025-08-17T00:00:00Z')
    .single();

  if (wordpressPost) {
    throw redirect(301, `/${slug}`);
  }

  // Load the post by slug — no date filter, just slug + published status
  const { data: post, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (fetchErr || !post) {
    throw error(404, 'Blog post not found');
  }

  // Calculate reading time
  const reading_time = Math.max(1, Math.round((post.content?.split(/\s+/).length || 0) / 200));

  // Simple markdown to HTML conversion
  const html = renderMarkdown(post.content || '');

  // Fetch related posts — only new posts (not WordPress-era), excluding current
  const { data: relatedRows } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, content, published_at')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .gte('created_at', '2025-08-17T00:00:00Z')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(4);

  const related = (relatedRows ?? []).map((r: any) => {
    const wordCount = r.content?.split(/\s+/).length || 0;
    const reading_time = Math.max(1, Math.round(wordCount / 200));
    
    // Smart thumbnail selection: cover_image_url first, then first image from content
    let thumbnail_url = r.cover_image_url;
    if (!thumbnail_url && r.content) {
      const imageMatch = r.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        thumbnail_url = imageMatch[2];
      }
    }

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      thumbnail_url,
      published_at: r.published_at,
      reading_time
    };
  });

  return {
    post: {
      ...post,
      reading_time
    },
    html,
    related
  };
};

function renderMarkdown(text: string): string {
  if (!text) return '';
  try {
    return marked.parse(text, { gfm: true, breaks: true }) as string;
  } catch (err) {
    console.error('Error parsing markdown:', err);
    return text;
  }
}