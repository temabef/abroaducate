import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// This route is deprecated. The Strategy Board is now part of /dashboard.
export const load: PageServerLoad = async ({ url }) => {
	const programId = url.searchParams.get('programId');
	const destination = programId ? `/dashboard?programId=${programId}` : '/dashboard';
	throw redirect(301, destination);
};
