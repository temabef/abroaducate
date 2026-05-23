import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const supabase = locals.supabase;

	// Cache the programs list for 5 minutes at the CDN edge
	// Programs don't change frequently — this makes the page load near-instant for most users
	setHeaders({
		'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
	});

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
