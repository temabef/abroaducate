import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: isAdmin, error: adminErr } = await locals.supabase.rpc('is_admin');
  if (adminErr || !isAdmin) throw error(403, 'Forbidden');
  
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const supabase = locals.supabase;
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

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

    // Auto-generate slug if empty
    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Auto-populate cover image from first content image if not provided
    let finalCoverImageUrl = cover_image_url || null;
    if (!finalCoverImageUrl && content) {
      const imageMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        finalCoverImageUrl = imageMatch[2]; // Extract URL from first image
      }
    }

    const insertPayload = {
      title,
      slug: finalSlug,
      content,
      cover_image_url: finalCoverImageUrl,
      status,
      author_user_id: locals.user?.id || null,
      published_at: status === 'published' ? new Date().toISOString() : null
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('blog_posts')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertErr) {
      console.error('Blog post creation error:', insertErr);
      return { success: false, message: insertErr.message };
    }

    throw redirect(303, '/admin/blog');
  }
};