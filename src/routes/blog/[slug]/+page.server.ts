import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const { slug } = params;

  // Check if this is a WordPress migrated post (should be handled by [wordpress_slug] route)
  const { data: wordpressPost } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .single();

  // If it's a WordPress post, redirect to the root URL (without /blog/)
  if (wordpressPost) {
    throw redirect(301, `/${slug}`);
  }

  // Continue with new blog posts (created after migration)
  const { data: post, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .gte('created_at', '2025-08-17T00:00:00Z') // Only new posts after migration
    .single();

  if (fetchErr || !post) {
    throw error(404, 'Blog post not found');
  }

  // Calculate reading time
  const reading_time = Math.max(1, Math.round((post.content?.split(/\s+/).length || 0) / 200));

  // Simple markdown to HTML conversion
  const html = renderMarkdown(post.content || '');

  // Fetch related posts — other published posts excluding current, most recent 4
  const { data: relatedRows } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, thumbnail_url, published_at, reading_time')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(4);

  const related = (relatedRows ?? []).map((r: any) => ({
    ...r,
    reading_time: r.reading_time ?? Math.max(1, Math.round((r.content?.split(/\s+/).length || 0) / 200))
  }));

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
  // First, let's process the text line by line to handle paragraphs better
  const lines = text.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) {
      processedLines.push(''); // Keep empty lines for paragraph breaks
      continue;
    }
    
    // Headers
    if (line.match(/^### /)) {
      line = line.replace(/^### (.*)$/, '<h3>$1</h3>');
    } else if (line.match(/^## /)) {
      line = line.replace(/^## (.*)$/, '<h2>$1</h2>');
    } else if (line.match(/^# /)) {
      line = line.replace(/^# (.*)$/, '<h1>$1</h1>');
    }
    // Images (process before other inline elements)
    else if (line.match(/!\[.*\]\(.*\)/)) {
      line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0;" />');
    }
    // Lists
    else if (line.match(/^- /)) {
      // Apply inline formatting to list items too
      let content = line.replace(/^- /, '');
      content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      line = `<li>${content}</li>`;
    }
    // Regular paragraph content
    else {
      // Apply inline formatting (bold, italic, links)
      line = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Wrap in paragraph tags if it's not already a special element
      if (!line.match(/^<(h[1-6]|img|li)/)) {
        line = `<p>${line}</p>`;
      }
    }
    
    processedLines.push(line);
  }
  
  // Join lines and clean up
  let html = processedLines.join('\n');
  
  // Wrap consecutive <li> elements in <ul> tags
  html = html.replace(/(<li>.*<\/li>\s*)+/gs, (match) => {
    return `<ul>${match}</ul>`;
  });
  
  // Clean up extra newlines and empty paragraphs
  html = html
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/\n/g, ' '); // Convert remaining newlines to spaces
  
  return html;
}