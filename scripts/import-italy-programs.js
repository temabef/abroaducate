/**
 * Import Italy programs from the enriched platform CSV into Supabase.
 *
 * Usage:
 *   node scripts/import-italy-programs.js --dry-run
 *   node scripts/import-italy-programs.js --apply
 *   node scripts/import-italy-programs.js --apply --replace-country
 *   node scripts/import-italy-programs.js --dry-run --csv path/to/file.csv
 *
 * This script mirrors import-lithuania-programs.js (same target schema and
 * application-platform conventions), with:
 *   - country label set to "Italy"
 *   - living cost default EUR 850 / month
 *   - default CSV is italy_final_upload_enriched.csv (post cleanup + deadline
 *     enrichment)
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const REPLACE_COUNTRY = process.argv.includes('--replace-country');
const csvArgIndex = process.argv.indexOf('--csv');
const requestedCsvPath = csvArgIndex >= 0 ? process.argv[csvArgIndex + 1] : null;

const DEFAULT_CSV_CANDIDATES = [
  resolve(__dirname, '..', 'italy_final_upload_enriched.csv'),
  resolve(__dirname, '..', 'italy_final_upload_cleaned.csv'),
  resolve(__dirname, '..', 'italy_final_upload.csv')
];

const CSV_PATH = requestedCsvPath
  ? resolve(process.cwd(), requestedCsvPath)
  : DEFAULT_CSV_CANDIDATES.find((path) => existsSync(path));

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CSV_PATH || !existsSync(CSV_PATH)) {
  console.error('Could not find an Italy CSV. Pass one with --csv path/to/file.csv');
  process.exit(1);
}

if (APPLY && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = APPLY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const COUNTRY = 'Italy';
const LIVING_COST_DEFAULT = 850;

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function toNumber(value, fallback = 0) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;

  const matches = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number.parseFloat(match[0]));
  if (!matches.length || matches.some((amount) => !Number.isFinite(amount))) return fallback;

  if (matches.length >= 2 && /-|to/i.test(text)) {
    return Number(((matches[0] + matches[1]) / 2).toFixed(2));
  }

  return Number(matches[0].toFixed(2));
}

function nullable(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeDegreeLevel(level) {
  const value = String(level || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (value.includes('bachelor')) return 'bachelor';
  if (value.includes('phd') || value.includes('doctor')) return 'phd';
  if (value.includes('short')) return 'short_course';
  return 'master';
}

function sanitizeUrl(value) {
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

function parseDurationMonths(row) {
  const explicitMonths = toNumber(row.program_duration_months, 0);
  if (explicitMonths > 0) return Math.round(explicitMonths);

  const text = String(row.duration || '').trim();
  if (!text) return 24;

  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*year/i);
  if (yearMatch) return Math.round(Number.parseFloat(yearMatch[1]) * 12);

  const semesterMatch = text.match(/(\d+(?:\.\d+)?)\s*semester/i);
  if (semesterMatch) return Math.round(Number.parseFloat(semesterMatch[1]) * 6);

  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*month/i);
  if (monthMatch) return Math.round(Number.parseFloat(monthMatch[1]));

  return 24;
}

function parseIntakes(intake) {
  const text = String(intake || '').trim();
  if (!text) return ['Winter'];
  if (/check official site/i.test(text)) return ['Check official site'];
  if (/all year/i.test(text)) return ['All year'];

  const normalized = text.toLowerCase();
  const intakes = new Set();
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

function parseCloseDate(deadline) {
  const text = String(deadline || '').trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
}

function buildProgramId(row, rowIndex) {
  const providedId = nullable(row.id);
  if (providedId) return slugify(providedId);

  const sourceFragment = slugify(row.source_url || row.direct_application_url || row.official_url || '').slice(-18);
  const base = slugify(
    [row.country || 'italy', row.university_name, row.program_name, row.city, row.degree_level]
      .filter(Boolean)
      .join('-')
  ).substring(0, 100);

  return [base, sourceFragment || rowIndex].filter(Boolean).join('-').replace(/-+$/g, '');
}

function buildApplicationSteps(row) {
  const deadline = String(row.application_deadline || '').trim();
  const universityName = String(row.university_name || '').trim();
  const programName = String(row.program_name || '').trim();

  return [
    {
      step_number: 1,
      title: 'Confirm Eligibility',
      description: `Review the official ${universityName} page and confirm entry requirements for ${programName}.`,
      type: 'university_action',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 2,
      title: 'Prepare Core Documents',
      description:
        'Gather transcripts, degree certificates, passport, CV, motivation letter, and language documents required by the university. Non-EU candidates will also need Universitaly pre-enrolment.',
      type: 'university_action',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 3,
      title: 'Submit Application',
      description:
        'Complete the official university application (early-bird round preferred) and submit all supporting documents before the stated deadline.',
      type: 'university_deadline',
      estimated_month: deadline || 'Check official site',
      deadline
    },
    {
      step_number: 4,
      title: 'Track Admission Updates',
      description:
        'Watch for interview invitations, ranking list publication, or admission offers. Confirm your place promptly to secure enrolment.',
      type: 'university_action',
      estimated_month: 'After submission',
      deadline: ''
    },
    {
      step_number: 5,
      title: 'Prepare Funding and Visa',
      description:
        'After admission, finalize tuition planning, Italian long-stay student visa (type D) documentation via Universitaly, accommodation, and codice fiscale registration.',
      type: 'visa_prep',
      estimated_month: 'After admission',
      deadline: ''
    }
  ];
}

function mapRow(row, universityIdMap, rowIndex) {
  const officialUrl = sanitizeUrl(row.official_url);
  const sourceUrl = sanitizeUrl(row.source_url);
  const directUrl = sanitizeUrl(row.direct_application_url) || officialUrl || sourceUrl;
  const livingCost = toNumber(row.living_cost_per_month, LIVING_COST_DEFAULT);
  const tuitionPerSemester = toNumber(row.tuition_per_semester, 0);
  const applicationFee = toNumber(row.application_fee, 0);
  const semesterFee = toNumber(row.semester_fee, 0);
  const durationMonths = parseDurationMonths(row);
  const closeDate = parseCloseDate(row.application_deadline);
  const universityName = String(row.university_name || '').trim();

  return {
    id: buildProgramId(row, rowIndex),
    program_name: String(row.program_name || '').trim(),
    university_name: universityName,
    university_id: universityIdMap.get(universityName.toLowerCase()) || null,
    country: COUNTRY,
    city: String(row.city || '').trim(),
    degree_level: normalizeDegreeLevel(row.degree_level),
    field_of_study: String(row.field_of_study || '').trim() || 'Various',
    language_of_instruction: String(row.language_of_instruction || '').trim() || 'English',
    tuition_per_semester: tuitionPerSemester,
    tuition_currency: 'EUR',
    tuition_label: tuitionPerSemester === 0 ? 'free' : tuitionPerSemester <= 5000 ? 'low_tuition' : 'paid',
    semester_fee: semesterFee,
    application_fee: applicationFee,
    application_fee_currency: 'EUR',
    has_application_fee: applicationFee > 0,
    living_cost_per_month: livingCost,
    blocked_account_per_year: Math.round(livingCost * 12 * 100) / 100,
    application_platform: 'direct',
    direct_application_url: directUrl,
    application_close_date: closeDate,
    program_duration_months: durationMonths,
    intakes: parseIntakes(row.intake),
    deadline_summary: nullable(row.application_deadline),
    funding_pathway: tuitionPerSemester > 0 ? 'funding_first' : 'program_first',
    funding_pathway_explanation:
      tuitionPerSemester > 0
        ? 'This programme has tuition for international students. Plan admission alongside scholarship research (DSU regional, Invest Your Talent in Italy) and personal funding preparation.'
        : 'This programme appears tuition-free in the source data. Focus funding planning on living costs, regional taxes, and Italian visa requirements after admission.',
    language_requirement: 'English',
    english_required: true,
    german_required: false,
    open_to_international: true,
    affordability_notes: [
      `Estimated living cost per month: EUR ${livingCost}`,
      sourceUrl ? `Source page: ${sourceUrl}` : ''
    ].filter(Boolean),
    official_source_url: sourceUrl || officialUrl || null,
    full_description_text: nullable(row.full_description_text),
    rubric_criteria: {
      english_level_required: 'Check official programme page',
      german_level_required: false
    },
    application_steps: buildApplicationSteps(row),
    notes: 'Imported from Italy programme CSV (enriched with researched deadlines).',
    is_active: true,
    intake: String(row.intake || '').trim() || 'Check official site',
    duration: String(row.duration || '').trim() || `${durationMonths} months`,
    format: String(row.format || '').trim() || 'On Campus',
    pace: String(row.pace || '').trim() || 'Full-time'
  };
}

function validateRows(rows) {
  const errors = [];
  rows.forEach((row, index) => {
    if (!nullable(row.program_name)) errors.push(`Row ${index + 2}: missing program_name`);
    if (!nullable(row.university_name)) errors.push(`Row ${index + 2}: missing university_name`);
    if (!nullable(row.city)) errors.push(`Row ${index + 2}: missing city`);
  });
  return errors;
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });
  const validationErrors = validateRows(rows);

  if (validationErrors.length) {
    console.error('CSV validation failed:');
    validationErrors.slice(0, 25).forEach((message) => console.error(`- ${message}`));
    if (validationErrors.length > 25) console.error(`...and ${validationErrors.length - 25} more`);
    process.exit(1);
  }

  const universityMap = new Map();
  for (const row of rows) {
    const name = String(row.university_name || '').trim();
    const key = name.toLowerCase();
    if (!universityMap.has(key)) {
      universityMap.set(key, {
        name,
        city: String(row.city || '').trim() || 'Varied'
      });
    }
  }

  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}`);
  console.log(`CSV: ${CSV_PATH}`);
  console.log(`Replace existing ${COUNTRY} programs: ${REPLACE_COUNTRY ? 'yes' : 'no'}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Universities: ${universityMap.size}`);

  const universityIdMap = new Map();

  if (APPLY) {
    for (const [key, uni] of universityMap) {
      const { data: existing, error: existingError } = await supabase
        .from('universities')
        .select('id')
        .ilike('name', uni.name)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        universityIdMap.set(key, existing.id);
        continue;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('universities')
        .insert({
          name: uni.name,
          country: COUNTRY,
          city: uni.city,
          type: 'Public University',
          tuition_type: 'Low Tuition',
          description: `${uni.name} is an Italian institution offering programmes for international students.`,
          living_cost_estimate: `EUR ${LIVING_COST_DEFAULT} / month`
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      universityIdMap.set(key, inserted.id);
    }
  }

  const programs = rows.map((row, index) => mapRow(row, universityIdMap, index + 2));
  const uniquePrograms = [];
  const seenIds = new Set();
  let renamedDuplicates = 0;

  for (const program of programs) {
    let id = program.id;
    let counter = 2;
    while (seenIds.has(id)) {
      id = `${program.id}-${counter}`;
      counter++;
    }
    if (id !== program.id) renamedDuplicates++;
    seenIds.add(id);
    uniquePrograms.push({ ...program, id });
  }

  console.log(`Programs prepared: ${uniquePrograms.length}`);
  console.log(`Duplicate IDs resolved with suffixes: ${renamedDuplicates}`);
  console.log(
    `Programs with close dates: ${uniquePrograms.filter((program) => program.application_close_date).length}`
  );
  console.log(
    `Programs with descriptions: ${uniquePrograms.filter((program) => program.full_description_text).length}`
  );
  console.log('Sample IDs:');
  uniquePrograms.slice(0, 5).forEach((program) => {
    console.log(`- ${program.id} | ${program.program_name} | ${program.university_name}`);
  });

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to upsert into Supabase.');
    return;
  }

  if (REPLACE_COUNTRY) {
    const { count: existingCount, error: countError } = await supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('country', COUNTRY);

    if (countError) throw countError;

    const { error: deleteError } = await supabase.from('programs').delete().eq('country', COUNTRY);
    if (deleteError) throw deleteError;
    console.log(`Deleted ${existingCount || 0} existing ${COUNTRY} program rows before replacement.`);
  }

  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < uniquePrograms.length; i += batchSize) {
    const batch = uniquePrograms.slice(i, i + batchSize);
    const { error } = await supabase.from('programs').upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) throw error;
    inserted += batch.length;
  }

  console.log(`Import complete. Upserted ${inserted} ${COUNTRY} programs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
