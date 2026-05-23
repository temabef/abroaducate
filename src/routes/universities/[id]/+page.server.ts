import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;
	const supabase = locals.supabase;

	const { data: university, error: uniError } = await supabase
		.from('universities')
		.select('*')
		.eq('id', id)
		.single();
		
	if (uniError || !university) {
		console.error(`[University Detail] Failed to fetch university with ID ${id}:`, uniError);
		// Return the error to the frontend instead of throwing a 404
		return {
			university: null,
			programs: [],
			debugError: uniError ? JSON.stringify(uniError) : 'University returned null'
		};
	}

	const { data: programs, error: progError } = await supabase
		.from('programs')
		.select('*')
		.eq('university_id', id)
		.order('program_name');

	if (progError) {
		console.error('Error fetching university programs:', progError);
	}

	return {
		university,
		programs: programs || []
	};
};
