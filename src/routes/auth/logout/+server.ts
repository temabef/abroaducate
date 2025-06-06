import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase } }) => {
  const { error: err } = await supabase.auth.signOut();

  if (err) {
    error(500, 'Something went wrong logging you out.');
  }

  redirect(303, '/');
}; 