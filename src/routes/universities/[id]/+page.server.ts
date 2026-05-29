import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const { id } = params;
	const supabase = locals.supabase;

	// Cache university detail pages for 10 minutes.
	setHeaders({ 'cache-control': 'public, max-age=600, s-maxage=600' });

	const { data: university, error: uniError } = await supabase
		.from('universities')
		.select('id, name, country, city, type, tuition_type, description, hero_image_url, global_rank, acceptance_rate, living_cost_estimate')
		.eq('id', id)
		.single();
		
	if (uniError || !university) {
		console.error(`[University Detail] Failed to fetch university with ID ${id}:`, uniError);
		return {
			university: null,
			programs: [],
			debugError: uniError ? JSON.stringify(uniError) : 'University returned null'
		};
	}

	// Only select columns needed for the program cards on this page.
	const { data: programs, error: progError } = await supabase
		.from('programs')
		.select('id, program_name, degree_level, field_of_study, tuition_per_semester, tuition_tier, language_of_instruction, application_close_date, deadline_summary, rubric_criteria, intake')
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
