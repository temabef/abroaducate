import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const supabase = locals.supabase;

  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin');
  if (adminErr || !isAdmin) {
    throw error(403, 'Forbidden');
  }

  // Pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = 20;
  const offset = (page - 1) * perPage;

  // Get total count for pagination
  const { count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  // Get posts for current page
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, status, published_at, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);

  return { 
    posts: posts ?? [], 
    pagination: {
      currentPage: page,
      totalPages,
      perPage,
      totalPosts: count || 0,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

export const actions: Actions = {
  async publish({ locals, request }) {
    const supabase = locals.supabase;
    const form = await request.formData();
    const id = String(form.get('id') || '');

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

    await supabase
      .from('blog_posts')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .eq('id', id);

    throw redirect(303, '/admin/blog');
  },

  async unpublish({ locals, request }) {
    const supabase = locals.supabase;
    const form = await request.formData();
    const id = String(form.get('id') || '');

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

    await supabase
      .from('blog_posts')
      .update({ 
        status: 'draft', 
        published_at: null 
      })
      .eq('id', id);

    throw redirect(303, '/admin/blog');
  },

  async archive({ locals, request }) {
    const supabase = locals.supabase;
    const form = await request.formData();
    const id = String(form.get('id') || '');

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

    await supabase
      .from('blog_posts')
      .update({ status: 'archived' })
      .eq('id', id);

    throw redirect(303, '/admin/blog');
  },

  async delete({ locals, request }) {
    const supabase = locals.supabase;
    const form = await request.formData();
    const id = String(form.get('id') || '');

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw error(403, 'Forbidden');

    await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    throw redirect(303, '/admin/blog');
  }
};