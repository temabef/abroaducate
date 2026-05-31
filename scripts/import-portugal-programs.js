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
  resolve(__dirname, '..', 'portugal_strict_upload_ready_conservative_cleaned.csv'),
  resolve(__dirname, '..', 'portugal_strict_upload_ready_conservative_198.csv')
];

const CSV_PATH = requestedCsvPath
  ? resolve(process.cwd(), requestedCsvPath)
  : DEFAULT_CSV_CANDIDATES.find((filePath) => existsSync(filePath));

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CSV_PATH || !existsSync(CSV_PATH)) {
  console.error('Could not find a Portugal CSV. Pass one with --csv path/to/file.csv');
  process.exit(1);
}

if (APPLY && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = APPLY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function nullable(value) {
  const text = String(value ?? '').trim();
  return text || null;
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

  const text = String(row.duration || '').trim().toLowerCase();
  if (!text) return 24;

  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*year|(\d+(?:\.\d+)?)\s*ano/);
  if (yearMatch) return Math.round(Number.parseFloat(yearMatch[1] || yearMatch[2]) * 12);

  const semesterMatch = text.match(/(\d+(?:\.\d+)?)\s*semester|(\d+(?:\.\d+)?)\s*semestre/);
  if (semesterMatch) return Math.round(Number.parseFloat(semesterMatch[1] || semesterMatch[2]) * 6);

  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*month|(\d+(?:\.\d+)?)\s*m[eê]s/);
  if (monthMatch) return Math.round(Number.parseFloat(monthMatch[1] || monthMatch[2]));

  return 24;
}

function parseIntakes(intake) {
  const text = String(intake || '').trim();
  if (!text) return ['Check official site'];
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

function determineTuitionLabel(tuitionPerSemester) {
  if (tuitionPerSemester === 0) return 'free';
  if (tuitionPerSemester <= 2500) return 'low_tuition';
  return 'paid';
}

function buildProgramId(row, rowIndex) {
  const providedId = nullable(row.id);
  if (providedId) return slugify(providedId);

  const officialFragment = slugify(row.official_url || row.direct_application_url || '').slice(-18);
  const base = slugify([
    row.country || 'portugal',
    row.university_name,
    row.program_name,
    row.city,
    row.degree_level
  ].filter(Boolean).join('-')).substring(0, 100);

  return [base, officialFragment || rowIndex].filter(Boolean).join('-').replace(/-+$/g, '');
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
      description: 'Gather transcripts, certificates, passport, CV, and any language documents required by the programme.',
      type: 'university_action',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 3,
      title: 'Submit Application',
      description: deadline
        ? 'Complete the official application and submit before the confirmed closing date.'
        : 'Complete the official application and verify the next live deadline on the programme page before submission.',
      type: 'university_deadline',
      estimated_month: deadline || 'Check official site',
      deadline
    },
    {
      step_number: 4,
      title: 'Track Admission Updates',
      description: 'Monitor the institution portal for ranking, document requests, and admission decisions.',
      type: 'university_action',
      estimated_month: 'After submission',
      deadline: ''
    },
    {
      step_number: 5,
      title: 'Prepare Enrollment and Relocation',
      description: 'After admission, plan tuition payment, housing, visa, and enrollment documentation.',
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
  const livingCost = toNumber(row.living_cost_per_month, 700);
  const tuitionPerSemester = toNumber(row.tuition_per_semester, 0);
  const applicationFee = toNumber(row.application_fee, 0);
  const semesterFee = toNumber(row.semester_fee, 0);
  const durationMonths = parseDurationMonths(row);
  const closeDate = parseCloseDate(row.application_deadline);
  const universityName = String(row.university_name || '').trim();
  const degreeLevel = normalizeDegreeLevel(row.degree_level);
  const language = String(row.language_of_instruction || '').trim() || 'Check official site';

  return {
    id: buildProgramId(row, rowIndex),
    program_name: String(row.program_name || '').trim(),
    university_name: universityName,
    university_id: universityIdMap.get(universityName.toLowerCase()) || null,
    country: 'Portugal',
    city: String(row.city || '').trim(),
    degree_level: degreeLevel,
    field_of_study: String(row.field_of_study || '').trim() || 'Various',
    language_of_instruction: language,
    tuition_per_semester: tuitionPerSemester,
    tuition_currency: 'EUR',
    tuition_label: determineTuitionLabel(tuitionPerSemester),
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
    funding_pathway_explanation: tuitionPerSemester > 0
      ? 'This programme has tuition for international students, so admission planning should run alongside funding preparation.'
      : 'This programme appears to have no tuition cost in the current dataset, so the main funding focus is living costs and relocation.',
    language_requirement: language,
    english_required: /english/i.test(language),
    german_required: false,
    open_to_international: true,
    affordability_notes: [
      `Estimated living cost per month: EUR ${livingCost}`,
      applicationFee > 0 ? `Application fee: EUR ${applicationFee}` : '',
      semesterFee > 0 ? `Registration or semester fee: EUR ${semesterFee}` : ''
    ].filter(Boolean),
    official_source_url: sourceUrl || officialUrl || null,
    full_description_text: nullable(row.full_description_text),
    rubric_criteria: {
      english_level_required: /english/i.test(language) ? 'Check official programme page' : false,
      german_level_required: false
    },
    application_steps: buildApplicationSteps(row),
    notes: 'Imported from Portugal cleaned CSV prepared for production upload.',
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
    if (!nullable(row.country)) errors.push(`Row ${index + 2}: missing country`);
    if (!nullable(row.city)) errors.push(`Row ${index + 2}: missing city`);
    if (!nullable(row.semester_fee)) errors.push(`Row ${index + 2}: missing semester_fee`);
    if (!nullable(row.application_fee)) errors.push(`Row ${index + 2}: missing application_fee`);
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
  console.log(`Replace existing Portugal programs: ${REPLACE_COUNTRY ? 'yes' : 'no'}`);
  console.log(`Rows in CSV: ${rows.length}`);
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
          country: 'Portugal',
          city: uni.city,
          type: 'Public University',
          tuition_type: 'Low Tuition',
          description: `${uni.name} is a Portuguese institution offering degree programmes for international students.`,
          living_cost_estimate: 'EUR 700 / month'
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
      counter += 1;
    }
    if (id !== program.id) renamedDuplicates += 1;
    seenIds.add(id);
    uniquePrograms.push({ ...program, id });
  }

  console.log(`Programs prepared: ${uniquePrograms.length}`);
  console.log(`Duplicate IDs resolved with suffixes: ${renamedDuplicates}`);
  console.log(`Programs with live close dates: ${uniquePrograms.filter((program) => program.application_close_date).length}`);
  console.log(`Programs with blank deadline summary: ${uniquePrograms.filter((program) => !program.deadline_summary).length}`);
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
      .eq('country', 'Portugal');

    if (countError) throw countError;

    console.log(`Existing Portugal programs to delete: ${existingCount || 0}`);

    if ((existingCount || 0) > 0) {
      const { error: deleteError } = await supabase
        .from('programs')
        .delete()
        .eq('country', 'Portugal');

      if (deleteError) throw deleteError;
      console.log('Deleted existing Portugal programs.');
    }
  }

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < uniquePrograms.length; i += BATCH_SIZE) {
    const batch = uniquePrograms.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('programs')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniquePrograms.length / BATCH_SIZE)} (${inserted}/${uniquePrograms.length})`);
  }

  const { count: finalCount, error: finalCountError } = await supabase
    .from('programs')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'Portugal');

  if (finalCountError) throw finalCountError;

  console.log(`\nImport complete. Portugal programs now in DB: ${finalCount || 0}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
