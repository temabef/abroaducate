import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

const CATEGORIES: Record<string, {
	slug: string;
	title: string;
	metaDescription: string;
	heading: string;
	description: string;
	filter: (query: any) => any;
}> = {
	'tuition-free': {
		slug: 'tuition-free',
		title: 'Tuition-Free Universities in Europe (2026/2027) — 0 EUR Degrees',
		metaDescription: 'Find accredited English-taught Master & Bachelor degree programs across Europe with 0 EUR tuition fees in Germany, Austria, and Scandinavia.',
		heading: 'Tuition-Free European University Programs',
		description: 'Explore 100% tuition-free degree programs across accredited public universities in Germany, Austria, Italy, and Scandinavia.',
		filter: (query: any) => query.eq('tuition_per_semester', 0)
	},
	'english-taught-masters': {
		slug: 'english-taught-masters',
		title: 'English-Taught Master\'s Degrees in Europe (2026/2027)',
		metaDescription: 'Discover 2,500+ accredited Master\'s degree programs in Europe taught 100% in English with low or €0 tuition.',
		heading: 'English-Taught Master\'s Degrees in Europe',
		description: 'Accredited 1 to 2-year Master programs taught entirely in English for international students across 10 European nations.',
		filter: (query: any) => query.eq('degree_level', 'master')
	}
};

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const slug = params.slug.toLowerCase();
	const cat = CATEGORIES[slug];

	if (!cat) {
		throw error(404, `Category '${params.slug}' not found.`);
	}

	setHeaders({
		'cache-control': 'public, max-age=600, s-maxage=600'
	});

	const supabase = locals.supabase;
	let programs: any[] = [];
	let totalCount = 0;

	if (supabase) {
		let query = supabase
			.from('programs')
			.select(PROGRAM_COLUMNS, { count: 'exact' })
			.eq('is_active', true);

		query = cat.filter(query);

		const { data, count, error: dbError } = await query
			.order('tuition_per_semester', { ascending: true })
			.limit(60);

		if (!dbError && data) {
			programs = data;
			totalCount = count || data.length;
		}
	}

	return {
		category: {
			slug: cat.slug,
			title: cat.title,
			metaDescription: cat.metaDescription,
			heading: cat.heading,
			description: cat.description
		},
		programs,
		totalCount
	};
};
