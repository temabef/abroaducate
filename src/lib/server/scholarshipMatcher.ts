/**
 * Shared scoring logic used by:
 *   - scripts/match-scholarships-to-programs.js  (batch)
 *   - src/routes/api/admin/match-scholarship/+server.ts (incremental, on save)
 *   - src/routes/api/cron/match-scholarships/+server.ts (daily)
 *
 * Scoring model (additive):
 *   +30  direct country match
 *   +25  institution-specific (scholarship.university_name == program.university_name)
 *   +20  degree level matches
 *   +15  field matches (substring / bucket)
 *   +15  broad-region match (Europe, EU, Global)
 *   +10  nationality not restricted
 *    +5  scholarship deadline >= program close date
 *    +5  scholarship amount covers tuition (when program has tuition)
 *   -20  scholarship deadline already past (rollover advised)
 *
 * Keep top N matches per program, minimum score >= 25.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const TOP_N = 5;
export const MIN_SCORE = 70; // Requires country (30) + level (20) + field (15) + nationality/deadline (5+)

const BROAD_LOCATIONS = [
	'europe',
	'eu',
	'european union',
	'multiple eu countries',
	'global',
	'worldwide',
	'international',
	'all'
];

export interface ProgramRow {
	id: string;
	country?: string | null;
	university_name?: string | null;
	program_name?: string | null;
	degree_level?: string | null;
	field_of_study?: string | null;
	tuition_per_semester?: number | null;
	application_close_date?: string | null;
}

export interface ScholarshipRow {
	id: string;
	title?: string | null;
	provider?: string | null;
	university_name?: string | null;
	location?: string | null;
	level?: string | null;
	levels?: string[] | null;
	field?: string | null;
	amount?: string | null;
	deadline?: string | null;
	type?: string | null;
	description?: string | null;
	nationality_restrictions?: string[] | null;
	is_active?: boolean | null;
}

export interface MatchRow {
	program_id: string;
	scholarship_id: string;
	score: number;
	match_rules: string[];
	covers: string[];
	rank_in_program: number;
}

function normalize(s: unknown): string {
	return String(s ?? '')
		.toLowerCase()
		.trim();
}

export function rollForwardIso(dateStr: string | null | undefined, today = new Date().toISOString().slice(0, 10)): string | null {
	if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
	const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!m) return null;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const [ty, tmo, td] = today.split('-').map(Number);
	let year = y;
	while (true) {
		if (year > ty) return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		if (year === ty) {
			if (mo > tmo || (mo === tmo && d >= td)) {
				return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			}
		}
		year += 1;
	}
}

function matchesLevel(programLevel: string | null | undefined, scholarshipLevel: string | null | undefined, scholarshipLevelsArr?: string[] | null): boolean {
	const target = normalize(programLevel);
	const candidates: string[] = [];
	if (scholarshipLevel) candidates.push(normalize(scholarshipLevel));
	if (Array.isArray(scholarshipLevelsArr)) candidates.push(...scholarshipLevelsArr.map(normalize));
	const joined = candidates.join(' ');
	if (target === 'master' && /master/.test(joined)) return true;
	if (target === 'bachelor' && /bachelor|undergraduate/.test(joined)) return true;
	if (target === 'phd' && /phd|doctoral|doctorate/.test(joined)) return true;
	if (target === 'short_course' && /short|certificate|diploma/.test(joined)) return true;
	return false;
}

function matchesCountry(programCountry: string | null | undefined, scholarshipLocation: string | null | undefined): { direct: boolean; broad: boolean } {
	if (!scholarshipLocation) return { direct: false, broad: false };
	const loc = normalize(scholarshipLocation);
	const c = normalize(programCountry);
	const direct = !!c && loc.includes(c);
	const broad = BROAD_LOCATIONS.some((b) => loc.includes(b));
	return { direct, broad };
}

function matchesField(programField: string | null | undefined, scholarshipField: string | null | undefined): boolean {
	const pf = normalize(programField);
	const sf = normalize(scholarshipField);
	if (!sf) return false;
	
	// Reject generic "All Fields" scholarships - they're too broad to be useful
	if (sf === 'all fields' || sf === 'all' || sf === 'various' || sf === 'any field') {
		return false;
	}
	
	if (!pf) return false;

	// Direct substring match (at least 4 characters)
	if (sf.length >= 4 && pf.includes(sf)) return true;
	if (pf.length >= 4 && sf.includes(pf)) return true;

	const buckets: string[][] = [
		['engineering', 'engineer', 'mechanical', 'civil', 'electrical'],
		['computer', 'computing', 'informatics', 'data', 'artificial intelligence', 'software', 'cyber'],
		['business', 'management', 'finance', 'economics', 'marketing', 'accounting', 'mba'],
		['health', 'medicine', 'medical', 'pharmacy', 'nursing', 'dental', 'veterinary'],
		// Social sciences listed BEFORE natural sciences so compound terms like
		// "social sciences" get categorised correctly and do not ride the
		// STEM-science keyword.
		['political', 'humanities', 'sociology', 'philosophy', 'history', 'social science'],
		['physics', 'chemistry', 'biology', 'mathematics', 'stem', 'natural science'],
		['arts', 'design', 'fashion', 'architecture', 'music', 'film'],
		['law', 'llm', 'legal'],
		['environment', 'ecology', 'sustainability', 'agriculture', 'agronomy']
	];
	// Track which bucket each side falls into so we only count a match when
	// they land in the same bucket (instead of "any shared keyword").
	let pBucket = -1;
	let sBucket = -1;
	for (let i = 0; i < buckets.length; i++) {
		const keywords = buckets[i];
		if (pBucket === -1 && keywords.some((k) => pf.includes(k))) pBucket = i;
		if (sBucket === -1 && keywords.some((k) => sf.includes(k))) sBucket = i;
		if (pBucket !== -1 && sBucket !== -1) break;
	}
	if (pBucket !== -1 && sBucket !== -1 && pBucket === sBucket) return true;
	return false;
}

function parseCovers(amount?: string | null, type?: string | null, description?: string | null): string[] {
	const text = normalize(`${amount ?? ''} ${type ?? ''} ${description ?? ''}`);
	const covers = new Set<string>();
	if (/full|fully.funded|full.funding/.test(text)) {
		covers.add('tuition');
		covers.add('living');
	}
	if (/tuition/.test(text)) covers.add('tuition');
	if (/stipend|living|monthly|allowance/.test(text)) covers.add('living');
	if (/travel/.test(text)) covers.add('travel');
	if (/insurance|health.insurance/.test(text)) covers.add('insurance');
	return [...covers];
}

export function scoreMatch(program: ProgramRow, scholarship: ScholarshipRow, today: string): { score: number; rules: string[]; covers: string[] } {
	const rules: string[] = [];
	let score = 0;

	// 1. MANDATORY: Country match
	const { direct, broad } = matchesCountry(program.country, scholarship.location);
	if (direct) {
		score += 30;
		rules.push('country');
	} else {
		// STRICT: No direct country match = cannot fund this program.
		return { score: 0, rules: ['no_country_match'], covers: [] };
	}

	// 2. Institution-specific (highest confidence)
	const institutionMatch = scholarship.university_name &&
		program.university_name &&
		normalize(scholarship.university_name) === normalize(program.university_name);
	
	if (institutionMatch) {
		score += 25;
		rules.push('institution');
	}

	// 3. MANDATORY: Level match
	if (matchesLevel(program.degree_level, scholarship.level, scholarship.levels)) {
		score += 20;
		rules.push('level');
	} else {
		// Level mismatch = cannot fund this program
		return { score: 0, rules: ['level_mismatch'], covers: [] };
	}

	// 4. MANDATORY: Field match
	const fieldMatch = matchesField(program.field_of_study, scholarship.field);
	if (fieldMatch) {
		score += 15;
		rules.push('field');
	} else {
		// No field match = not eligible for this scholarship
		// This rejects "All Fields" scholarships and field mismatches
		return { score: 0, rules: ['field_mismatch_or_too_broad'], covers: [] };
	}

	// 5. Nationality restrictions
	const restrictions = Array.isArray(scholarship.nationality_restrictions) ? scholarship.nationality_restrictions : [];
	if (restrictions.length === 0) {
		score += 10;
		rules.push('nationality_open');
	}

	// 6. Deadline viability
	if (scholarship.deadline && program.application_close_date) {
		if (scholarship.deadline <= program.application_close_date) {
			score += 5;
			rules.push('deadline_viable');
		}
	}

	// 7. Tuition coverage
	const covers = parseCovers(scholarship.amount, scholarship.type, scholarship.description);
	if ((program.tuition_per_semester || 0) > 0 && covers.includes('tuition')) {
		score += 5;
		rules.push('tuition_covered');
	}

	// 8. Past deadline penalty
	if (scholarship.deadline && scholarship.deadline < today) {
		score -= 20;
		rules.push('deadline_past');
	}

	return { score, rules, covers };
}

/**
 * Incremental re-match: given one scholarship, re-score it against every
 * program and update the top-N positions. We only touch rows for this
 * scholarship, then recompute per-program ranks (so if this new scholarship
 * bumps an existing match out of the top 5, that is reflected).
 */
export async function rematchScholarship(
	supabase: SupabaseClient,
	scholarshipId: string,
	opts: { rolloverIfPast?: boolean; persistRollover?: boolean } = {}
): Promise<{ inserted: number; reranked: number; newDeadline?: string | null; skipped?: string; demoted?: number }> {
	const today = new Date().toISOString().slice(0, 10);

	const { data: s, error: sErr } = await supabase
		.from('scholarships')
		.select('*')
		.eq('id', scholarshipId)
		.single();
	if (sErr || !s) throw new Error(`Scholarship ${scholarshipId} not found: ${sErr?.message}`);

	const { data: oldMatches, error: oldMatchError } = await supabase
		.from('program_scholarship_matches')
		.select('program_id')
		.eq('scholarship_id', scholarshipId);
	if (oldMatchError) throw oldMatchError;
	const oldProgramIds = [...new Set((oldMatches || []).map((m: any) => m.program_id))];

	if (!s.is_active) {
		// Remove any stale matches for an inactive scholarship
		await supabase.from('program_scholarship_matches').delete().eq('scholarship_id', scholarshipId);
		const demoted = await demoteStaleScholarshipFundedPrograms(oldProgramIds);
		return { inserted: 0, reranked: 0, skipped: 'inactive', demoted };
	}

	// Roll deadline forward if requested (same behaviour as batch)
	let effectiveScholarship: ScholarshipRow = s as ScholarshipRow;
	let newDeadline: string | null | undefined;
	if (opts.rolloverIfPast && s.deadline && s.deadline < today) {
		const rolled = rollForwardIso(s.deadline, today);
		if (rolled && rolled !== s.deadline) {
			effectiveScholarship = { ...s, deadline: rolled } as ScholarshipRow;
			newDeadline = rolled;
			if (opts.persistRollover) {
				await supabase
					.from('scholarships')
					.update({ deadline: rolled, deadline_recurrence: 'annual' })
					.eq('id', scholarshipId);
			}
		}
	}

	// Pull all programs (lightweight columns only)
	const PAGE = 1000;
	const programs: ProgramRow[] = [];
	let from = 0;
	while (true) {
		const { data, error } = await supabase
			.from('programs')
			.select('id, country, university_name, program_name, degree_level, field_of_study, tuition_per_semester, application_close_date')
			.range(from, from + PAGE - 1);
		if (error) throw error;
		if (!data || data.length === 0) break;
		programs.push(...(data as ProgramRow[]));
		if (data.length < PAGE) break;
		from += PAGE;
	}

	async function demoteStaleScholarshipFundedPrograms(programIds: string[]): Promise<number> {
		if (programIds.length === 0) return 0;
		const { data: stillMatched, error: stillError } = await supabase
			.from('program_scholarship_matches')
			.select('program_id')
			.in('program_id', programIds);
		if (stillError) throw stillError;
		const stillSet = new Set((stillMatched || []).map((m: any) => m.program_id));

		const { data: fundedPrograms, error: fundedError } = await supabase
			.from('programs')
			.select('id, tuition_per_semester')
			.eq('tuition_tier', 'scholarship_funded')
			.in('id', programIds);
		if (fundedError || !fundedPrograms) return 0;

		let demoted = 0;
		for (const p of fundedPrograms) {
			if (!stillSet.has(p.id)) {
				const tuition = p.tuition_per_semester ?? 0;
				const newTier = tuition === 0 ? 'zero_tuition' : tuition <= 5000 ? 'low_tuition' : 'paid';
				const { error } = await supabase
					.from('programs')
					.update({ tuition_tier: newTier })
					.eq('id', p.id);
				if (!error) demoted += 1;
			}
		}
		return demoted;
	}

	// Delete existing matches for this scholarship (we're about to recompute)
	await supabase.from('program_scholarship_matches').delete().eq('scholarship_id', scholarshipId);

	// Score against every program
	type Candidate = {
		program_id: string;
		score: number;
		match_rules: string[];
		covers: string[];
	};
	const candidates: Candidate[] = [];
	for (const p of programs) {
		const { score, rules, covers } = scoreMatch(p, effectiveScholarship, today);
		if (score >= MIN_SCORE) {
			candidates.push({ program_id: p.id, score, match_rules: rules, covers });
		}
	}

	// For each candidate program, only keep this scholarship if it earns a
	// top-TOP_N slot (compare against the existing matches for that program).
	const programIds = candidates.map((c) => c.program_id);
	const { data: existingForPrograms } = await supabase
		.from('program_scholarship_matches')
		.select('program_id, scholarship_id, score, match_rules, covers, rank_in_program')
		.in('program_id', programIds);

	const byProgram = new Map<string, { program_id: string; scholarship_id: string; score: number; match_rules: string[]; covers: string[]; rank_in_program: number | null }[]>();
	for (const r of existingForPrograms ?? []) {
		const arr = byProgram.get(r.program_id) ?? [];
		arr.push(r as never);
		byProgram.set(r.program_id, arr);
	}

	const rowsToInsert: MatchRow[] = [];
	const rerankUpdates: { program_id: string; scholarship_id: string; rank_in_program: number }[] = [];
	for (const cand of candidates) {
		const existing = byProgram.get(cand.program_id) ?? [];
		const combined = [
			...existing.map((e) => ({
				program_id: e.program_id,
				scholarship_id: e.scholarship_id,
				score: e.score,
				match_rules: Array.isArray(e.match_rules) ? e.match_rules : [],
				covers: Array.isArray(e.covers) ? e.covers : []
			})),
			{
				program_id: cand.program_id,
				scholarship_id: scholarshipId,
				score: cand.score,
				match_rules: cand.match_rules,
				covers: cand.covers
			}
		];
		combined.sort((a, b) => b.score - a.score);
		const top = combined.slice(0, TOP_N);
		const inTop = top.find((t) => t.scholarship_id === scholarshipId);
		if (inTop) {
			rowsToInsert.push({
				program_id: cand.program_id,
				scholarship_id: scholarshipId,
				score: cand.score,
				match_rules: cand.match_rules,
				covers: cand.covers,
				rank_in_program: top.indexOf(inTop) + 1
			});
			top.forEach((t, idx) => {
				if (t.scholarship_id !== scholarshipId) {
					rerankUpdates.push({
						program_id: t.program_id,
						scholarship_id: t.scholarship_id,
						rank_in_program: idx + 1
					});
				}
			});
		}
	}

	let inserted = 0;
	if (rowsToInsert.length > 0) {
		const { error } = await supabase.from('program_scholarship_matches').insert(rowsToInsert);
		if (error) throw error;
		inserted = rowsToInsert.length;
	}

	let reranked = 0;
	for (const r of rerankUpdates) {
		const { error } = await supabase
			.from('program_scholarship_matches')
			.update({ rank_in_program: r.rank_in_program })
			.eq('program_id', r.program_id)
			.eq('scholarship_id', r.scholarship_id);
		if (!error) reranked += 1;
	}

	// Promote programs with scholarship matches to scholarship_funded tier
	// regardless of their tuition amount. A scholarship-funded program is one
	// that has at least one matching scholarship, even if it's low-tuition or
	// zero-tuition (the scholarship may cover living costs, travel, etc.).
	const programsCovered = rowsToInsert.map((r) => r.program_id);
	if (programsCovered.length > 0) {
		await supabase
			.from('programs')
			.update({ tuition_tier: 'scholarship_funded' })
			.in('id', programsCovered);
	}

	const demoted = await demoteStaleScholarshipFundedPrograms(oldProgramIds);
	return { inserted, reranked, newDeadline, demoted };
}
