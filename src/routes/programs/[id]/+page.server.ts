import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Explicit column list for the detail page — avoids select('*') which pulls
// every column including large unused fields, reducing egress per page view.
const DETAIL_COLUMNS = [
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
	'rubric_criteria',
	'intake',
	'intakes',
	'program_duration_months',
	'application_steps',
	'full_description_text',
	'is_active'
].join(',');

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const supabase = locals.supabase;
	const { id } = params;

	// Cache individual program pages for 10 minutes at the CDN edge.
	// Program data changes infrequently; this cuts egress significantly for
	// popular programs that get many repeat visits.
	setHeaders({
		'cache-control': 'public, max-age=600, s-maxage=600'
	});

	let program = null;
	let university = null;
	let scholarships: any[] = [];

	if (supabase) {
		const { data, error: dbError } = await supabase
			.from('programs')
			.select(DETAIL_COLUMNS)
			.eq('id', id)
			.single();

		if (data) {
			program = data;
		} else {
             console.error('Program not found in DB', dbError);
        }

		if (program?.university_id) {
			const { data: universityData, error: universityError } = await supabase
				.from('universities')
				.select('id, name')
				.eq('id', program.university_id)
				.maybeSingle();

			if (!universityError && universityData) {
				university = universityData;
			}
		}

		if (!university && program?.university_name) {
			const { data: universityData, error: universityError } = await supabase
				.from('universities')
				.select('id, name')
				.ilike('name', program.university_name)
				.maybeSingle();

			if (!universityError && universityData) {
				university = universityData;
			}
		}

		if (program?.id) {
			// Read precomputed matches from program_scholarship_matches.
			// If zero matches exist for this program, show nothing — that is honest.
			// The legacy broad-country fallback has been removed: it was showing
			// scholarships from Japan, Kazakhstan, Qatar etc. on European programs.
			const { data: matchData, error: matchError } = await supabase
				.from('public_program_scholarship_matches')
				.select('*')
				.eq('program_id', program.id)
				.order('rank_in_program', { ascending: true });

			if (!matchError && matchData && matchData.length > 0) {
				scholarships = matchData.map((m: any) => ({
					id: m.scholarship_id,
					title: m.scholarship_title,
					provider: m.scholarship_provider,
					amount: m.scholarship_amount,
					deadline: m.scholarship_deadline,
					location: m.scholarship_location,
					type: m.scholarship_type,
					website: m.scholarship_website,
					level: m.scholarship_level,
					field: m.scholarship_field,
					funding_category: m.funding_category,
					description: m.scholarship_description,
					match_score: m.score,
					match_rules: m.match_rules,
					covers: m.covers,
					rank_in_program: m.rank_in_program
				}));
			} else if (matchError && matchError.code !== '42P01') {
				console.error('program_scholarship_matches lookup failed', matchError);
			}
		}
	}

	if (!program) {
		throw error(404, 'Program not found');
	}

	// Similar programs: same country + same field, different program, sorted by tuition asc
	let similarPrograms: any[] = [];
	if (program?.id && program?.country) {
		const fieldOfStudy = program.field_of_study || program.rubric_criteria?.field_of_study || null;
		let query = supabase
			.from('programs')
			.select('id, program_name, university_name, country, tuition_per_semester, tuition_tier, degree_level')
			.eq('country', program.country)
			.neq('id', program.id)
			.order('tuition_per_semester', { ascending: true })
			.limit(6);

		// Prefer same field if available
		if (fieldOfStudy) {
			const { data: sameField } = await query.ilike('field_of_study', `%${fieldOfStudy}%`);
			if (sameField && sameField.length >= 3) {
				similarPrograms = sameField.slice(0, 3);
			}
		}

		// Fall back to same country, any field
		if (similarPrograms.length < 3) {
			const { data: anyField } = await supabase
				.from('programs')
				.select('id, program_name, university_name, country, tuition_per_semester, tuition_tier, degree_level')
				.eq('country', program.country)
				.neq('id', program.id)
				.order('tuition_per_semester', { ascending: true })
				.limit(3);
			if (anyField) {
				// Merge, deduplicate, take 3
				const seen = new Set(similarPrograms.map((p: any) => p.id));
				for (const p of anyField) {
					if (!seen.has(p.id)) {
						similarPrograms.push(p);
						seen.add(p.id);
					}
					if (similarPrograms.length >= 3) break;
				}
			}
		}
	}

	return {
		program,
		university,
		scholarships,
		similarPrograms
	};
};
