import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const { data: { session } } = await locals.supabase.auth.getSession();
	if (!session?.user) {
		throw redirect(303, `/auth?next=${encodeURIComponent(url.pathname)}`);
	}

	const { data: cv, error: dbError } = await locals.supabase
		.from('academic_cvs')
		.select('*')
		.eq('id', params.id)
		.eq('user_id', session.user.id)
		.maybeSingle();

	if (dbError) {
		console.error('[academic-cv/[id]] Fetch error:', dbError);
		throw error(500, 'Could not load CV');
	}
	if (!cv) {
		throw error(404, 'CV not found');
	}

	return { cv };
};
