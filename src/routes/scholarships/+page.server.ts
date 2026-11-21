import type { PageServerLoad } from './$types';

/**
 * Server-rendered preview of the newest scholarships.
 * The interactive directory still loads the full list in the browser, but crawlers
 * (and visitors before hydration) get real scholarship links instead of a spinner.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const cols = 'id, title, provider, deadline, location';
	const today = new Date().toISOString().split('T')[0];

	let { data, error } = await locals.supabase
		.from('public_scholarships_decoded')
		.select(cols)
		.gte('deadline', today)
		.order('created_at', { ascending: false })
		.limit(24);

	if (error) {
		({ data } = await locals.supabase
			.from('scholarships')
			.select(cols)
			.gte('deadline', today)
			.order('created_at', { ascending: false })
			.limit(24));
	}

	return {
		initialScholarships: (data ?? []) as Array<{
			id: string;
			title: string;
			provider: string | null;
			deadline: string | null;
			location: string | null;
		}>
	};
};
