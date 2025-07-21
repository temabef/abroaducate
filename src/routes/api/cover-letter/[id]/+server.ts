import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const coverLetterId = params.id;
  const { data, error } = await supabase
    .from('cover_letters')
    .select('generated_content')
    .eq('id', coverLetterId)
    .eq('user_id', session.user.id)
    .single();
  if (error || !data) {
    return json({ error: 'Cover letter not found' }, { status: 404 });
  }
  return json({ generated_content: data.generated_content });
}; 