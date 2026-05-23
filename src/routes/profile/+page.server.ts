import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();
	const supabase = locals.supabase;

	if (!session?.user?.id || !supabase) {
		throw redirect(303, `/auth?next=${encodeURIComponent(url.pathname)}`);
	}

	const userId = session.user.id;

	const { data: profile } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	return {
		user: {
			id: userId,
			email: session.user.email,
			user_metadata: session.user.user_metadata
		},
		profile: profile || null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		
		const updates = {
			user_id: session.user.id,
			field_of_study: formData.get('field_of_study')?.toString() || null,
			current_level: formData.get('current_level')?.toString() || null,
			target_level: formData.get('target_level')?.toString() || null,
			gpa: formData.get('gpa') ? parseFloat(formData.get('gpa')!.toString()) : null,
			ielts_score: formData.get('ielts_score') ? parseFloat(formData.get('ielts_score')!.toString()) : null,
			toefl_score: formData.get('toefl_score') ? parseInt(formData.get('toefl_score')!.toString()) : null,
			nationality: formData.get('nationality')?.toString() || null,
			updated_at: new Date().toISOString()
		};

		const { error } = await locals.supabase
			.from('user_profiles')
			.upsert(updates, { onConflict: 'user_id' });

		if (error) {
			console.error('[PROFILE] Update Error:', error);
			return fail(500, { error: error.message });
		}

		throw redirect(303, '/dashboard');
	}
};
