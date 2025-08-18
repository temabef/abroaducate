import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const supabase = locals.supabase;
  
  // Get query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search') || '';
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at, content', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  // Add search filter if provided
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data: posts, error, count } = await query;

  if (error) {
    return {
      posts: [],
      total: 0,
      page,
      pageSize,
      search,
      totalPages: 1
    };
  }

  // Calculate reading time, auto-generate excerpts, and find thumbnail images
  const postsWithExtras = (posts || []).map(post => {
    const wordCount = post.content?.split(/\s+/).length || 0;
    const reading_time = Math.max(1, Math.round(wordCount / 200));
    
    // Auto-generate excerpt from content (first 150 characters, ending at word boundary)
    let auto_excerpt = '';
    if (post.content) {
      const plainText = post.content
        .replace(/[#*`_\[\]]/g, '') // Remove markdown formatting
        .replace(/\n+/g, ' ') // Replace line breaks with spaces
        .trim();
      
      if (plainText.length > 150) {
        auto_excerpt = plainText.substring(0, 150);
        const lastSpace = auto_excerpt.lastIndexOf(' ');
        if (lastSpace > 100) {
          auto_excerpt = auto_excerpt.substring(0, lastSpace) + '...';
        } else {
          auto_excerpt = auto_excerpt + '...';
        }
      } else {
        auto_excerpt = plainText;
      }
    }
    
    // Smart thumbnail selection: cover_image_url first, then first image from content
    let thumbnail_url = post.cover_image_url;
    
    if (!thumbnail_url && post.content) {
      // Extract first image from markdown content
      const imageMatch = post.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        thumbnail_url = imageMatch[2]; // The URL is the second capture group
      }
    }
    
    return {
      ...post,
      reading_time,
      excerpt: post.excerpt || auto_excerpt, // Use manual excerpt if exists, otherwise auto-generated
      thumbnail_url // Smart thumbnail for grid display
    };
  });

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    posts: postsWithExtras,
    total,
    page,
    pageSize,
    search,
    totalPages
  };
};