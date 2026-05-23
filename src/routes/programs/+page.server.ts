import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	let dbPrograms: any[] = [];
	try {
		if (supabase) {
			const batchSize = 1000;
			let from = 0;

			while (true) {
				const to = from + batchSize - 1;
				const { data, error } = await supabase
					.from('programs')
					.select('*, universities(type)')
					.eq('is_active', true)
					.range(from, to);

				if (error) {
					console.error('Error fetching programs batch', error);
					break;
				}

				if (!data || data.length === 0) {
					break;
				}

				dbPrograms = [...dbPrograms, ...data];

				if (data.length < batchSize) {
					break;
				}

				from += batchSize;
			}
		}
	} catch (err) {
		console.error('Error fetching programs', err);
	}

	return {
		programs: dbPrograms
	};
};
