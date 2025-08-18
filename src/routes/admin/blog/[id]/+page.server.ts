import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) throw error(403, 'Forbidden');

  const { id } = params;
  const { data: post, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !post) throw error(404, 'Post not found');
  
  return { post };
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    const supabase = locals.supabase;
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

    const { id } = params;
    const form = await request.formData();
    
    const title = String(form.get('title') || '').trim();
    const slug = String(form.get('slug') || '').trim();
    const content = String(form.get('content') || '').trim();
    const cover_image_url = String(form.get('cover_image_url') || '').trim();
    const status = String(form.get('status') || 'draft');

    // Validation
    if (!title || !content) {
      return { success: false, message: 'Title and content are required.' };
    }

    // Auto-populate cover image from first content image if not provided
    let finalCoverImageUrl = cover_image_url || null;
    if (!finalCoverImageUrl && content) {
      const imageMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        finalCoverImageUrl = imageMatch[2]; // Extract URL from first image
      }
    }

    // Get current post to preserve published_at if already published
    const { data: currentPost } = await supabase
      .from('blog_posts')
      .select('published_at, status')
      .eq('id', id)
      .single();

    const updates = {
      title,
      slug,
      content,
      cover_image_url: finalCoverImageUrl,
      status,
      // Only set published_at if changing from non-published to published
      // If already published, keep the original date
      published_at: status === 'published' 
        ? (currentPost?.status === 'published' ? currentPost.published_at : new Date().toISOString())
        : null,
      updated_at: new Date().toISOString()
    };

    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id);

    if (updateErr) {
      console.error('Blog post update error:', updateErr);
      return { success: false, message: updateErr.message };
    }

    throw redirect(303, '/admin/blog');
  }
};