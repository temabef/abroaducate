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
	const fieldSlug = params.field.toLowerCase();

	const countryMeta = COUNTRY_HUBS[countrySlug];
	const fieldMeta = FIELD_HUBS[fieldSlug];

	if (!countryMeta || !fieldMeta) {
		throw error(404, `Hub not found for ${params.country} / ${params.field}`);
	}

	setHeaders({
		'cache-control': 'public, max-age=600, s-maxage=600'
	});

	const supabase = locals.supabase;
	let programs: any[] = [];
	let totalCount = 0;

	if (supabase) {
		// Build OR query for field keywords with double quotes to properly handle spaces
		const orClauses = fieldMeta.searchKeywords
			.map(k => `field_of_study.ilike."%${k}%",program_name.ilike."%${k}%"`)
			.join(',');

		const { data, count, error: dbError } = await supabase
			.from('programs')
			.select(PROGRAM_COLUMNS, { count: 'exact' })
			.ilike('country', countryMeta.name)
			.or(orClauses)
			.eq('is_active', true)
			.order('tuition_per_semester', { ascending: true })
			.limit(60);

		if (!dbError && data) {
			programs = data;
			totalCount = count || data.length;
		}
	}

	const dynamicTitle = `Top English ${fieldMeta.name} Degrees in ${countryMeta.name} (2026/2027)`;
	const dynamicDescription = `Discover accredited English-taught ${fieldMeta.name} programs in ${countryMeta.name}. Compare tuition fees, deadlines, and universities with Abroaducate.`;

	return {
		country: countryMeta,
		field: fieldMeta,
		programs,
		totalCount,
		dynamicTitle,
		dynamicDescription,
		availableFields: Object.values(FIELD_HUBS)
	};
};
