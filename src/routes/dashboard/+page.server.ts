import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session?.user?.id) {
    throw redirect(303, '/auth?next=/plan');
  }
  throw redirect(303, '/plan');
};

