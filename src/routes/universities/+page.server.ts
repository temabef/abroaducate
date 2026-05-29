import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const supabase = locals.supabase;

	// Cache the university list for 10 minutes — it changes rarely.
	setHeaders({ 'cache-control': 'public, max-age=600, s-maxage=600' });

	const { data: universities, error } = await supabase
		.from('universities')
		.select('id, name, country, city, type, tuition_type, description, hero_image_url, global_rank, acceptance_rate, programs(count)')
		.order('name');
		
	if (error) {
		console.error('Error fetching universities:', error);
	}

	return {
		universities: universities || []
	};
};
