import type { PageServerLoad } from './$types';

// Minimal columns for the program list page card display + filters.
const LIST_COLUMNS = [
	'id',
	'program_name',
	'university_name',
	'country',
	'city',
	'degree_level',
	'field_of_study',
	'tuition_per_semester',
	'semester_fee',
	'tuition_tier',
	'language_of_instruction',
	'application_deadline',
	'application_close_date',
	'intake',
	'duration',
	'format',
	'pace',
	'is_active',
	'university_id'
].join(',');

const PAGE_SIZE = 30;

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	const supabase = locals.supabase;

	// Cache for 5 minutes at the CDN edge — drastically reduces egress for
	// crawlers and repeat visitors.
	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=300'
	});

	// Read filter/pagination params from the URL.
	const searchQuery = (url.searchParams.get('q') || '').trim();
	const countries = url.searchParams.getAll('country');
	const languages = url.searchParams.getAll('lang');
	const degreeLevels = url.searchParams.getAll('level');
	const intakes = url.searchParams.getAll('intake');
	const tiers = url.searchParams.getAll('tier');
	const maxTuition = parseInt(url.searchParams.get('maxTuition') || '10000', 10);
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
	const sort = url.searchParams.get('sort') || 'recommended';

	let dbPrograms: any[] = [];
	let totalCount = 0;
	let countryOptions: string[] = [];

	try {
		if (supabase) {
			// 1. Get distinct country list once for the filter sidebar (cheap query).
			const { data: countryRows } = await supabase
				.from('programs')
				.select('country')
				.eq('is_active', true)
				.not('country', 'is', null);
			countryOptions = [
				...new Set((countryRows || []).map((r: any) => r.country).filter(Boolean))
			].sort() as string[];

			// 2. Build the filtered query.
			let query = supabase
				.from('programs')
				.select(`${LIST_COLUMNS}, universities(type)`, { count: 'exact' })
				.eq('is_active', true);

			if (searchQuery) {
				const q = `%${searchQuery}%`;
				query = query.or(
					`program_name.ilike.${q},university_name.ilike.${q},field_of_study.ilike.${q},city.ilike.${q},country.ilike.${q}`
				);
			}

			if (countries.length > 0) {
				query = query.in('country', countries);
			}

			if (degreeLevels.length > 0) {
				query = query.in('degree_level', degreeLevels);
			}

			if (tiers.length > 0) {
				query = query.in('tuition_tier', tiers);
			}

			if (languages.length > 0) {
				const langOr = languages.map((l) => `language_of_instruction.ilike.%${l}%`).join(',');
				query = query.or(langOr);
			}

			if (intakes.length > 0) {
				const intakeOr = intakes.map((i) => `intake.ilike.%${i}%`).join(',');
				query = query.or(intakeOr);
			}

			// Tuition cap. If the only selected tier is scholarship_funded, skip the cap.
			const scholarshipFundedOnly =
				tiers.length > 0 && tiers.every((t) => t === 'scholarship_funded');
			if (!scholarshipFundedOnly && maxTuition < 10000) {
				// Annual tuition = tuition_per_semester * 2, so cap per-semester at half.
				query = query.lte('tuition_per_semester', Math.ceil(maxTuition / 2));
			}

			// Sort
			if (sort === 'lowest-fee') {
				query = query.order('tuition_per_semester', { ascending: true, nullsFirst: false });
			} else if (sort === 'deadline') {
				query = query.order('application_close_date', { ascending: true, nullsFirst: false });
			} else {
				// recommended: programs with valid deadlines first, by most recent first
				query = query.order('application_close_date', { ascending: true, nullsFirst: false });
			}
			query = query.order('id', { ascending: false });

			// Paginate
			const from = (page - 1) * PAGE_SIZE;
			const to = from + PAGE_SIZE - 1;
			query = query.range(from, to);

			const { data, error, count } = await query;

			if (error) {
				console.error('Error fetching programs', error);
			} else {
				dbPrograms = data || [];
				totalCount = count || 0;
			}
		}
	} catch (err) {
		console.error('Error fetching programs', err);
	}

	return {
		programs: dbPrograms,
		totalCount,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
		countryOptions,
		filters: {
			q: searchQuery,
			countries,
			languages,
			degreeLevels,
			intakes,
			tiers,
			maxTuition,
			sort
		}
	};
};
