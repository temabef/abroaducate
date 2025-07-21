import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sopId = params.id;
  const { data, error } = await supabase
    .from('sops')
    .select('content')
    .eq('id', sopId)
    .eq('user_id', session.user.id)
    .single();
  if (error || !data) {
    return json({ error: 'SOP not found' }, { status: 404 });
  }
  return json({ content: data.content });
}; 