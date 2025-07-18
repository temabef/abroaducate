import { json } from '@sveltejs/kit';

export async function GET({ params, locals: { supabase } }) {
  const { slug } = params;
  const { data, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('id', slug)
    .single();

  if (error || !data) {
    return new Response('Not found', { status: 404 });
  }

  return json(data);
} 