import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
	const session = await getSession();

	if (!session) {
		throw redirect(303, '/auth/login?redirect=/cold-email');
	}

	const { data: profile } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', session.user.id)
		.single();

	return {
		user: session.user,
		profile
	};
};
