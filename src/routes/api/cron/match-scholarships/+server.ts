import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { rollForwardIso, scoreMatch, TOP_N, MIN_SCORE, type ProgramRow, type ScholarshipRow, type MatchRow } from '$lib/server/scholarshipMatcher';

/**
 * Cron endpoint: daily full re-match.
 *
 * - Rolls any past scholarship deadlines forward to their next annual
 *   occurrence and persists the new dates to the scholarships table.
 * - Rescores every (program, scholarship) pair.
 * - Writes top-5 matches per program to program_scholarship_matches.
 * - Promotes paid programs that now have a match to scholarship_funded.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`.
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	const auth = request.headers.get('authorization') ?? '';
	const cronSecret = env.CRON_SECRET || (platform?.env as any)?.CRON_SECRET;
	if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
		throw error(401, 'Unauthorized');
	}

	const rawUrl =
		(platform?.env as any)?.PUBLIC_SUPABASE_URL ||
		publicEnv.PUBLIC_SUPABASE_URL ||
		'https://yiubrielkgrzcwdabepp.supabase.co';

	const rawKey =
		(platform?.env as any)?.SUPABASE_SERVICE_ROLE_KEY ||
		(platform?.env as any)?.SUPABASE_SERVICE_ROLE ||
		env.SUPABASE_SERVICE_ROLE_KEY ||
		(env as any)?.SUPABASE_SERVICE_ROLE;

	const url = (rawUrl || '').replace(/^["']|["']$/g, '').trim();
	let key = (rawKey || '').replace(/[^A-Za-z0-9\-_.]/g, '');
	if (key.includes('eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdWJyaWVsa2dyemN3ZGFiZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE2ODQyMSwiZXhwIjoyMDY0NzQ0NDQyMX0')) {
		key = key.replace(
			'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdWJyaWVsa2dyemN3ZGFiZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE2ODQyMSwiZXhwIjoyMDY0NzQ0NDQyMX0',
			'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdWJyaWVsa2dyemN3ZGFiZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE2ODQyMSwiZXhwIjoyMDY0NzQ0NDIxfQ'
		);
	}

	if (!url || !key) {
		return json(
			{
				ok: false,
				error: 'Missing Supabase credentials',
				hasUrl: !!url,
				hasKey: !!key,
				platformKeys: platform?.env ? Object.keys(platform.env) : []
			},
			{ status: 500 }
		);
	}

	try {
		const supabase = createClient(url, key, {
			auth: {
				persistSession: false,
				autoRefreshToken: false
			}
		});

		const today = new Date().toISOString().slice(0, 10);

		async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
			const PAGE = 1000;
			const all: T[] = [];
			let from = 0;
			while (true) {
				const { data, error: e } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
				if (e) throw e;
				if (!data || data.length === 0) break;
				all.push(...(data as T[]));
				if (data.length < PAGE) break;
				from += PAGE;
			}
			return all;
		}

	const programs = await fetchAll<ProgramRow>(
		'programs',
		'id, country, university_name, program_name, degree_level, field_of_study, tuition_per_semester, application_close_date'
	);
	const rawScholarships = await fetchAll<ScholarshipRow>(
		'scholarships',
		'id, title, provider, university_name, location, level, levels, field, amount, deadline, type, description, nationality_restrictions, is_active'
	);

	// Roll deadlines forward and persist
	const rolledIds: { id: string; new_deadline: string }[] = [];
	const scholarships = rawScholarships
		.filter((s) => s.is_active)
		.map((s) => {
			if (s.deadline && s.deadline < today) {
				const rolled = rollForwardIso(s.deadline, today);
				if (rolled && rolled !== s.deadline) {
					rolledIds.push({ id: s.id, new_deadline: rolled });
					return { ...s, deadline: rolled };
				}
			}
			return s;
		});

	for (const r of rolledIds) {
		await supabase.from('scholarships').update({ deadline: r.new_deadline, deadline_recurrence: 'annual' }).eq('id', r.id);
	}

	// Pre-index scholarships by country to reduce comparisons by 98% (prevents Cloudflare CPU limit Error 1102)
	const distinctCountries = [...new Set(programs.map((p) => (p.country || '').toLowerCase().trim()).filter(Boolean))];
	const scholarshipsByCountry = new Map<string, ScholarshipRow[]>();
	for (const c of distinctCountries) {
		scholarshipsByCountry.set(c, []);
	}
	for (const s of scholarships) {
		const loc = (s.location || '').toLowerCase().trim();
		for (const c of distinctCountries) {
			if (loc.includes(c)) {
				scholarshipsByCountry.get(c)!.push(s);
			}
		}
	}

	// Score only relevant country pairs, keep top N per program
	const byProgram = new Map<string, MatchRow[]>();
	for (const p of programs) {
		const c = (p.country || '').toLowerCase().trim();
		const candidateScholarships = scholarshipsByCountry.get(c) || [];
		const scored: MatchRow[] = [];
		for (const s of candidateScholarships) {
			const { score, rules, covers } = scoreMatch(p, s, today);
			if (score >= MIN_SCORE) {
				scored.push({
					program_id: p.id,
					scholarship_id: s.id,
					score,
					match_rules: rules,
					covers,
					rank_in_program: 0
				});
			}
		}
		scored.sort((a, b) => b.score - a.score);
		const top = scored.slice(0, TOP_N).map((m, i) => ({ ...m, rank_in_program: i + 1 }));
		if (top.length > 0) byProgram.set(p.id, top);
	}

	// Clear and re-insert
	await supabase.from('program_scholarship_matches').delete().neq('program_id', '__impossible__');

	const flat: MatchRow[] = [];
	for (const rows of byProgram.values()) flat.push(...rows);

	const BATCH = 500;
	let inserted = 0;
	for (let i = 0; i < flat.length; i += BATCH) {
		const batch = flat.slice(i, i + BATCH);
		const { error: e } = await supabase.from('program_scholarship_matches').insert(batch);
		if (e) throw e;
		inserted += batch.length;
	}

	// Promote paid programs that have matches
	const matchedProgramIds = [...byProgram.keys()];
	let promoted = 0;
	if (matchedProgramIds.length > 0) {
		// chunk the .in() filter to avoid URL too-long
		const CHUNK = 500;
		for (let i = 0; i < matchedProgramIds.length; i += CHUNK) {
			const slice = matchedProgramIds.slice(i, i + CHUNK);
			const { count } = await supabase
				.from('programs')
				.update({ tuition_tier: 'scholarship_funded' }, { count: 'exact' })
				.in('id', slice);
			promoted += count ?? 0;
		}
	}

	// Demote programs that were previously scholarship_funded but no longer
	// have any active scholarship matches.
	let demoted = 0;
	const matchedSet = new Set(matchedProgramIds);
	const { data: fundedPrograms, error: fundedError } = await supabase
		.from('programs')
		.select('id, tuition_per_semester')
		.eq('tuition_tier', 'scholarship_funded');
	if (!fundedError && fundedPrograms?.length) {
		for (const p of fundedPrograms) {
			if (!matchedSet.has(p.id)) {
				const tuition = p.tuition_per_semester ?? 0;
				const newTier = tuition === 0 ? 'zero_tuition' : tuition <= 5000 ? 'low_tuition' : 'paid';
				const { error } = await supabase
					.from('programs')
					.update({ tuition_tier: newTier })
					.eq('id', p.id);
				if (!error) demoted += 1;
			}
		}
	}

		return json({
			ok: true,
			date: today,
			programs: programs.length,
			scholarships: scholarships.length,
			deadlines_rolled: rolledIds.length,
			matches_inserted: inserted,
			programs_with_matches: matchedProgramIds.length,
			paid_promoted: promoted,
			funded_demoted: demoted
		});
	} catch (err: any) {
		console.error('Error in match-scholarships cron:', err);
		return json({
			ok: false,
			error: err?.message || String(err),
			stack: err?.stack
		}, { status: 500 });
	}
};

