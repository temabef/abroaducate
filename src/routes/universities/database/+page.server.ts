import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  // Preserve any query parameters from the original URL
  const queryString = url.search;
  return redirect(302, `/universities/phase2${queryString}`);
}; 