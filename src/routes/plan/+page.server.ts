import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = await locals.getSession();
  if (!session?.user?.id) {
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(303, `/auth?next=${next}`);
  }

  return {};
};

