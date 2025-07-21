import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const psId = params.id;
  const { data, error } = await supabase
    .from('personal_statements')
    .select('generated_content')
    .eq('id', psId)
    .eq('user_id', session.user.id)
    .single();
  if (error || !data) {
    return json({ error: 'Personal statement not found' }, { status: 404 });
  }
  return json({ generated_content: data.generated_content });
}; 