import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawProgram {
	id?: string;
	program_name: string;
	university_name: string;
	country: string;
	city: string;
	tuition_per_semester: number | string;
	semester_fee: number | string;
	application_fee: number | string;
	living_cost_per_month: number | string;
	degree_level: string;
	field_of_study: string;
	application_deadline: string;
	official_url: string;
	language_of_instruction?: string;
	direct_application_url?: string;
	source_url?: string;
	full_description_text?: string;
	program_duration_months?: number | string;
	intake?: string;
	duration?: string;
	format?: string;
	pace?: string;
}

// ─── AI Enrichment ────────────────────────────────────────────────────────────
async function enrichProgram(program: RawProgram) {
	const prompt = `You are a university admissions expert. Given the following European Master's program, generate structured enrichment data.

Program: ${program.program_name}
University: ${program.university_name}
City: ${program.city}, ${program.country}
Field of Study: ${program.field_of_study}
Tuition per Semester: €${program.tuition_per_semester}
Degree Level: ${program.degree_level}

Return a JSON object with EXACTLY these fields (no extra text, just valid JSON):
{
  "full_description_text": "A compelling 2-3 sentence description of the program for prospective international students.",
  "funding_pathway": "ONE of: funding_first | program_first | professor_dependent",
  "funding_pathway_explanation": "A 1-2 sentence explanation of the recommended application strategy.",
  "application_steps": [
    { "step_number": 1, "title": "Step title", "description": "Step description", "type": "university_action", "estimated_month": "Month name", "deadline": "" },
    { "step_number": 2, "title": "Step title", "description": "Step description", "type": "university_action", "estimated_month": "Month name", "deadline": "" },
    { "step_number": 3, "title": "Step title", "description": "Step description", "type": "university_deadline", "estimated_month": "Month name", "deadline": "" },
    { "step_number": 4, "title": "Step title", "description": "Step description", "type": "visa_prep", "estimated_month": "Month name", "deadline": "" },
    { "step_number": 5, "title": "Step title", "description": "Step description", "type": "university_action", "estimated_month": "Month name", "deadline": "" }
  ],
  "rubric_criteria": {
    "min_gpa": 2.5,
    "english_level_required": "IELTS 6.5 or equivalent",
    "german_level_required": false
  }
}`;

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.4,
			response_format: { type: 'json_object' }
		})
	});

	if (!response.ok) {
		throw new Error(`OpenAI error: ${response.status}`);
	}

	const data = await response.json();
	const content = data.choices[0]?.message?.content;
	return JSON.parse(content);
}

function slugify(value: string) {
	return String(value || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildProgramSlug(raw: RawProgram, seenSlugs: Set<string>) {
	const providedId = raw.id?.trim();
	const base = providedId
		? slugify(providedId)
		: slugify([
				raw.country?.trim() || 'program',
				raw.university_name?.trim(),
				raw.program_name?.trim(),
				raw.city?.trim(),
				raw.degree_level?.trim()
			].filter(Boolean).join('-'));

	const prefix = base.substring(0, 110) || 'program';
	let slug = prefix;
	let counter = 2;
	while (seenSlugs.has(slug)) {
		const suffix = `-${counter}`;
		slug = `${prefix.substring(0, 120 - suffix.length)}${suffix}`;
		counter++;
	}
	seenSlugs.add(slug);
	return slug;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
const CZK_PER_EUR = 24.366;

function parseOptionalNumber(value: unknown): number | null {
	const text = String(value ?? '').trim();
	if (!text) return null;

	const normalized = text.replace(/,/g, '.');
	const match = normalized.match(/-?\d+(?:\.\d+)?/);
	if (!match) return null;

	const parsed = Number.parseFloat(match[0]);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseApplicationFee(value: unknown): number {
	const text = String(value ?? '').trim();
	if (!text) return 0;

	const amount = parseOptionalNumber(text);
	if (amount === null) return 0;
	if (/czk/i.test(text)) return Number((amount / CZK_PER_EUR).toFixed(2));
	return Number(amount.toFixed(2));
}

function parseSemesterFee(value: unknown, country: string): number {
	const amount = parseOptionalNumber(value);
	if (amount !== null) return amount;
	return country.trim().toLowerCase() === 'germany' ? 300 : 0;
}

function parseLivingCost(value: unknown): number {
	const text = String(value ?? '').trim();
	if (!text) return 934;

	const matches = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number.parseFloat(match[0]));
	if (!matches.length || matches.some((amount) => !Number.isFinite(amount))) return 934;

	if (matches.length >= 2 && /-|to/i.test(text)) {
		return Number(((matches[0] + matches[1]) / 2).toFixed(2));
	}

	return Number(matches[0].toFixed(2));
}

function normalizeDegreeLevel(value: unknown): 'bachelor' | 'master' | 'phd' | 'short_course' {
	const text = String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');

	if (text.includes('bachelor')) return 'bachelor';
	if (text.includes('phd') || text.includes('doctor')) return 'phd';
	if (text.includes('short')) return 'short_course';
	return 'master';
}

function parseProgramDurationMonths(durationMonths: unknown, durationLabel: unknown): number {
	const explicitMonths = parseOptionalNumber(durationMonths);
	if (explicitMonths && explicitMonths > 0) {
		return Math.round(explicitMonths);
	}

	const text = String(durationLabel ?? '').trim();
	if (!text) return 24;

	const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*year/i);
	if (yearMatch) return Math.round(Number.parseFloat(yearMatch[1]) * 12);

	const semesterMatch = text.match(/(\d+(?:\.\d+)?)\s*semester/i);
	if (semesterMatch) return Math.round(Number.parseFloat(semesterMatch[1]) * 6);

	const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*month/i);
	if (monthMatch) return Math.round(Number.parseFloat(monthMatch[1]));

	return 24;
}

function parseIntakes(value: unknown): string[] {
	const text = String(value ?? '').trim();
	if (!text) return ['Winter'];
	if (/check official site/i.test(text)) return ['Check official site'];
	if (/all year/i.test(text)) return ['All year'];

	const normalized = text.toLowerCase();
	const intakes = new Set<string>();
	if (/autumn|fall/.test(normalized)) intakes.add('Autumn');
	if (/winter/.test(normalized)) intakes.add('Winter');
	if (/spring/.test(normalized)) intakes.add('Spring');
	if (/summer/.test(normalized)) intakes.add('Summer');

	if (intakes.size > 0) return [...intakes];

	return text
		.split(/[\/,|]/)
		.map((part) => part.trim())
		.filter(Boolean);
}

function sanitizeUrl(value: unknown): string | null {
	const text = String(value ?? '').trim();
	if (!text) return null;
	if (/^more information$/i.test(text) || /^check official site$/i.test(text)) return null;

	const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text.replace(/^\/+/, '')}`;

	try {
		const url = new URL(withProtocol);
		if (!/^https?:$/i.test(url.protocol)) return null;
		return url.toString();
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify admin using the USER's supabase client (has auth context)
		const { data: isAdmin } = await locals.supabase.rpc('can_manage_scholarships');
		if (!isAdmin) {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		const { programs, useAI } = await request.json();

		if (!programs || !Array.isArray(programs) || programs.length === 0) {
			return json({ error: 'No programs provided' }, { status: 400 });
		}

		const results = {
			inserted: 0,
			errors: [] as { program: string; error: string }[],
			skipped: 0
		};
		const seenSlugs = new Set<string>();

		for (const raw of programs as RawProgram[]) {
			try {
				const slug = buildProgramSlug(raw, seenSlugs);

				// ── Auto-create or find the university ──────────────────────
				let universityId: string | null = null;
				const universityName = raw.university_name?.trim();

				if (universityName) {
					// Check if university already exists (case-insensitive match)
					const { data: existingUni } = await supabaseAdmin
						.from('universities')
						.select('id')
						.ilike('name', universityName)
						.maybeSingle();

					if (existingUni) {
						universityId = existingUni.id;
					} else {
						// Create a new university record from program data
						const { data: newUni, error: uniErr } = await supabaseAdmin
							.from('universities')
							.insert({
								name: universityName,
								country: raw.country?.trim() || 'Germany',
								city: raw.city?.trim() || '',
								type: raw.country === 'Germany' ? 'Public Research' : 'Public Research',
								tuition_type: Number(raw.tuition_per_semester) === 0 ? 'Zero Tuition' : 'Low Tuition State',
								description: `${universityName} is a leading institution offering international Master's programs in ${raw.city || 'Europe'}.`,
								living_cost_estimate: `€${raw.living_cost_per_month || 900} / month`
							})
							.select('id')
							.single();

						if (uniErr) {
							console.warn(`[IMPORT] Could not create university ${universityName}:`, uniErr.message);
						} else {
							universityId = newUni?.id || null;
							console.log(`[IMPORT] ✅ Auto-created university: ${universityName} (${universityId})`);
						}
					}
				}

				// Format program name from "Name (M.Sc.)" to "M.Sc. Name"
			let formattedProgramName = raw.program_name?.trim() || '';
			const match = formattedProgramName.match(/^(.*?)\s*\((B\.?Sc\.?|M\.?Sc\.?|B\.?A\.?|M\.?A\.?|Ph\.?D\.?|MBA)\)$/i);
			if (match) {
				// e.g., "M.Sc. Software Systems"
				formattedProgramName = `${match[2]} ${match[1]}`;
			}

			const officialUrl = sanitizeUrl(raw.official_url);
			const sourceUrl = sanitizeUrl(raw.source_url);
			const directApplicationUrl = sanitizeUrl(raw.direct_application_url) || officialUrl || sourceUrl;

			const programRow: any = {
					id: slug,
					program_name: formattedProgramName,
					university_name: universityName,
					university_id: universityId,
					country: raw.country?.trim() || 'Germany',
					city: raw.city?.trim() || '',
					tuition_per_semester: parseOptionalNumber(raw.tuition_per_semester) || 0,
					semester_fee: parseSemesterFee(raw.semester_fee, raw.country?.trim() || 'Germany'),
					application_fee: parseApplicationFee(raw.application_fee),
					living_cost_per_month: parseLivingCost(raw.living_cost_per_month),
					degree_level: normalizeDegreeLevel(raw.degree_level),
					field_of_study: raw.field_of_study?.trim() || 'Various',
					language_of_instruction: raw.language_of_instruction?.trim() || 'English',
					program_duration_months: parseProgramDurationMonths(raw.program_duration_months, raw.duration),
					intakes: parseIntakes(raw.intake),
					application_steps: [],
					rubric_criteria: { min_gpa: 2.5, english_level_required: 'IELTS 6.5', german_level_required: false },
					funding_pathway: 'program_first',
					funding_pathway_explanation: '',
					deadline_summary: raw.application_deadline?.trim() || null,
					direct_application_url: directApplicationUrl,
					official_source_url: officialUrl || sourceUrl,
					full_description_text: raw.full_description_text?.trim() || null,
					intake: raw.intake?.trim() || 'Winter',
					duration: raw.duration?.trim() || '',
					format: raw.format?.trim() || 'On Campus',
					pace: raw.pace?.trim() || 'Full-time'
				};

				// AI Enrichment
				if (useAI) {
					try {
						const enriched = await enrichProgram(raw);
						if (!programRow.full_description_text && enriched.full_description_text) {
							programRow.full_description_text = enriched.full_description_text;
						}
						programRow.application_steps = enriched.application_steps || [];
						programRow.funding_pathway = enriched.funding_pathway || 'program_first';
						programRow.funding_pathway_explanation = enriched.funding_pathway_explanation || '';
						programRow.rubric_criteria = enriched.rubric_criteria || programRow.rubric_criteria;
					} catch (aiErr: any) {
						console.warn(`[IMPORT] AI enrichment failed for ${raw.program_name}:`, aiErr.message);
					}
				}

				// Upsert program
				const { error } = await supabaseAdmin
					.from('programs')
					.upsert(programRow, { onConflict: 'id', ignoreDuplicates: false });

				if (error) {
					console.error(`[IMPORT] Failed to upsert program ${raw.program_name}:`, error);
					results.errors.push({ program: raw.program_name, error: error.message });
				} else {
					results.inserted++;
				}

			} catch (rowErr: any) {
				results.errors.push({ program: raw.program_name || 'Unknown', error: rowErr.message });
			}
		}

		return json({
			success: true,
			inserted: results.inserted,
			errors: results.errors,
			skipped: results.skipped
		});

	} catch (err: any) {
		console.error('[BULK IMPORT] Error:', err);
		return json({ error: err.message || 'Import failed' }, { status: 500 });
	}
};
