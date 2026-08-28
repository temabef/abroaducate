import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { COUNTRY_HUBS, FIELD_HUBS } from '$lib/config/countryHubs';

const PROGRAM_COLUMNS = [
	'id',
	'program_name',
	'university_name',
	'university_id',
	'country',
	'city',
	'degree_level',
	'field_of_study',
	'tuition_per_semester',
	'tuition_currency',
	'semester_fee',
	'tuition_tier',
	'language_of_instruction',
	'application_close_date',
	'deadline_summary',
	'intake',
	'duration',
	'format',
	'pace',
	'is_active',
	'direct_application_url'
].join(',');

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const countrySlug = params.country.toLowerCase();
	const countryMeta = COUNTRY_HUBS[countrySlug];

	if (!countryMeta) {
		throw error(404, `Country hub '${params.country}' not found.`);
	}

	setHeaders({
		'cache-control': 'public, max-age=600, s-maxage=600'
	});

	const supabase = locals.supabase;
	let programs: any[] = [];
	let totalCount = 0;
	let tuitionFreeCount = 0;

	if (supabase) {
		const { data, count, error: dbError } = await supabase
			.from('programs')
			.select(PROGRAM_COLUMNS, { count: 'exact' })
			.ilike('country', countryMeta.name)
			.eq('is_active', true)
			.order('tuition_per_semester', { ascending: true })
			.limit(60);

		if (!dbError && data) {
			programs = data;
			totalCount = count || data.length;
			tuitionFreeCount = data.filter((p: any) => (p.tuition_per_semester || 0) === 0).length;
		}
	}

	return {
		country: countryMeta,
		programs,
		totalCount,
		tuitionFreeCount,
		availableFields: Object.values(FIELD_HUBS)
	};
};
