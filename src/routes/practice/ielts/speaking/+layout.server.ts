import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, user } }) => {
  if (!user) {
    throw redirect(303, '/auth-required');
  }

  return {
    user,
  };
}; 