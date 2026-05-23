import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const { data: universities, error } = await supabase
		.from('universities')
		.select('*, programs(count)')
		.order('name');
		
	if (error) {
		console.error('Error fetching universities:', error);
	}

	return {
		universities: universities || []
	};
};
