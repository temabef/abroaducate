/**
 * Import low-cost Austrian English-taught programmes into Supabase.
 *
 * By default this upserts Austria universities and programs without deleting
 * other country catalogs. Use --replace-country to remove existing Austria
 * program rows before importing a curated replacement CSV.
 *
 * Usage:
 *   node scripts/import-austria-programs.js --dry-run
 *   node scripts/import-austria-programs.js --apply
 *   node scripts/import-austria-programs.js --apply --replace-country
 *   node scripts/import-austria-programs.js --dry-run --csv path/to/file.csv
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
  resolve(__dirname, '..', 'austria_programmes_production_platform_full_ready.csv'),
  resolve(__dirname, '..', 'austria_programmes_production_platform_quality_ready.csv'),
  resolve(__dirname, '..', 'austria_programmes_production_platform.csv'),
  resolve(__dirname, '..', 'austria_programmes_under_10000_eur_english_only_admin_import_extended.csv'),
  resolve(__dirname, '..', 'output', 'austria_english_programmes_v7', 'austria_programmes_under_10000_eur_admin_import_extended.csv'),
  resolve(__dirname, '..', 'austria_programmes_under_10000_eur_english_only_admin_import_strict.csv'),
  resolve(__dirname, '..', 'austria_programmes_under_10000_eur_english_only.csv')
];

const CSV_PATH = requestedCsvPath
  ? resolve(process.cwd(), requestedCsvPath)
  : DEFAULT_CSV_CANDIDATES.find((path) => existsSync(path));

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CSV_PATH || !existsSync(CSV_PATH)) {
  console.error('Could not find an Austria CSV. Pass one with --csv path/to/file.csv');
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

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstValue(row, keys) {
  for (const key of keys) {
    const value = String(row[key] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function nullable(value) {
  const text = String(value || '').trim();
  return text || null;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

const MONTHS = new Map([
  ['january', 1],
  ['february', 2],
  ['march', 3],
  ['april', 4],
  ['may', 5],
  ['june', 6],
  ['july', 7],
  ['august', 8],
  ['september', 9],
  ['october', 10],
  ['november', 11],
  ['december', 12]
]);

function toIsoDate(year, month, day) {
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseDeadlineDates(deadlineText) {
  const defaultYear = new Date().getFullYear();
  const text = String(deadlineText || '').replace(/\s+/g, ' ').trim();
  const dates = [];

  const addDate = (year, month, day) => {
    const iso = toIsoDate(year, month, day);
    if (iso && !dates.includes(iso)) dates.push(iso);
  };

  for (const match of text.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g)) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    addDate(year, Number(match[2]), Number(match[1]));
  }

  for (const match of text.matchAll(/\b([A-Z][a-z]+)\s+(\d{1,2}),\s*(20\d{2})\b/g)) {
    const month = MONTHS.get(match[1].toLowerCase());
    addDate(Number(match[3]), month, Number(match[2]));
  }

  for (const match of text.matchAll(/\b(\d{1,2})\s+([A-Z][a-z]+)\s+(20\d{2})\b/g)) {
    const month = MONTHS.get(match[2].toLowerCase());
    addDate(Number(match[3]), month, Number(match[1]));
  }

  for (const match of text.matchAll(/\b(\d{1,2})\s+([A-Z][a-z]+)\b(?!\s*,?\s*20\d{2})/g)) {
    const month = MONTHS.get(match[2].toLowerCase());
    addDate(defaultYear, month, Number(match[1]));
  }

  return dates.sort();
}

function parseDeadlineWindow(deadlineText) {
  const text = String(deadlineText || '').trim();
  const nonEuMatch = text.match(/non-EU:\s*([^;]+)/i);
  const relevantText = nonEuMatch?.[1] || text;
  const dates = parseDeadlineDates(relevantText);

  if (!dates.length) return { open: null, close: null };
  return {
    open: dates.length > 1 ? dates[0] : null,
    close: dates[dates.length - 1]
  };
}

function normalizeDegreeLevel(level) {
  const value = String(level || '').toLowerCase();
  if (value.includes('bachelor')) return 'bachelor';
  if (value.includes('phd') || value.includes('doctor')) return 'phd';
  if (value.includes('short')) return 'short_course';
  return 'master';
}

function normalizeUniversityType(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('fachhochschule')) return 'University of Applied Sciences';
  if (value.includes('privat')) return 'Private University';
  if (value.includes('padagog') || value.includes('paedagog')) return 'University College of Teacher Education';
  if (value.includes('universitat') || value.includes('university')) return 'Public University';
  return type || 'Austrian Higher Education Institution';
}

function durationFromRow(row) {
  const explicitMonths = toNumber(row.program_duration_months);
  if (explicitMonths) {
    return {
      label: firstValue(row, ['duration', 'duration_text']) || `${explicitMonths} months`,
      months: explicitMonths
    };
  }

  const semesters = toNumber(firstValue(row, ['duration_semesters']));
  if (semesters) {
    return {
      label: firstValue(row, ['duration', 'duration_text']) || `${semesters} Semester`,
      months: semesters * 6
    };
  }

  const durationText = firstValue(row, ['duration', 'duration_text']);
  const semesterMatch = durationText.match(/(\d+)\s*semester/i);
  if (semesterMatch) {
    const semesterCount = Number.parseInt(semesterMatch[1], 10);
    return { label: durationText, months: semesterCount * 6 };
  }

  return { label: durationText || null, months: 24 };
}

function parseIntakes(row) {
  const intake = firstValue(row, ['intake', 'intake_semester']);
  if (!intake) return ['Check official site'];

  const intakes = [];
  if (/winter/i.test(intake)) intakes.push('Winter');
  if (/summer/i.test(intake)) intakes.push('Summer');
  if (/autumn|fall/i.test(intake)) intakes.push('Autumn');
  if (/spring/i.test(intake)) intakes.push('Spring');
  return intakes.length ? intakes : [intake];
}

function sourceKey(row) {
  const source = firstValue(row, [
    'canonical_detail_url',
    'studienwahl_detail_url',
    'student_information_url',
    'official_url',
    'source_catalogue_url'
  ]);
  const match = source.match(/\/(\d+)-/);
  return match?.[1] || slugify(source).slice(-30);
}

function buildProgramId(row, rowIndex, parts) {
  const providedId = firstValue(row, ['id']);
  if (providedId) return slugify(providedId);

  const uniquePart = slugify(sourceKey(row) || rowIndex).slice(0, 20);
  const basePart = slugify(parts.filter(Boolean).join('-')).substring(0, 95);
  return `${basePart}-${uniquePart}`.replace(/-+$/g, '');
}

function buildApplicationSteps(row) {
  const programName = firstValue(row, ['program_name', 'programme_name', 'degree_programme_name']);
  const universityName = firstValue(row, ['university_name']);
  const deadline = firstValue(row, ['application_deadline', 'application_deadline_international']);

  return [
    {
      step_number: 1,
      title: 'Confirm Eligibility',
      description: `Review the official ${universityName} programme page and confirm academic, language, and subject requirements for ${programName}.`,
      type: 'university_action',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 2,
      title: 'Prepare Core Documents',
      description: 'Gather transcripts, degree certificates, passport, CV, motivation materials, and English-language proof required by the university.',
      type: 'university_action',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 3,
      title: 'Submit University Application',
      description: 'Apply through the university or listed admissions route and upload all required documents before the official deadline.',
      type: 'university_deadline',
      estimated_month: deadline || 'Check official site',
      deadline
    },
    {
      step_number: 4,
      title: 'Confirm Fees and Admission Conditions',
      description: 'Verify tuition, student union fees, recognition requirements, and any entrance or supplementary examinations.',
      type: 'university_action',
      estimated_month: 'After submission',
      deadline: ''
    },
    {
      step_number: 5,
      title: 'Plan Residence Permit and Funding',
      description: 'After admission, prepare Austrian residence permit documents, proof of funds, housing plans, and scholarship applications.',
      type: 'visa_prep',
      estimated_month: 'After admission',
      deadline: ''
    }
  ];
}

function mapRow(row, universityIdMap, rowIndex) {
  const programName = firstValue(row, ['program_name', 'programme_name', 'degree_programme_name']);
  const universityName = firstValue(row, ['university_name']);
  const city = firstValue(row, ['city', 'location']) || 'Varied';
  const degreeLevel = normalizeDegreeLevel(firstValue(row, ['degree_level', 'degree_type', 'academic_degree']));
  const fieldOfStudy = firstValue(row, ['field_of_study', 'field_group']) || 'Various';
  const tuitionPerSemester = toNumber(firstValue(row, [
    'tuition_per_semester',
    'non_eu_tuition_eur_per_semester',
    'non_eu_tuition_eur_per_semester_estimate'
  ]));
  const semesterFee = toNumber(firstValue(row, [
    'semester_fee',
    'compulsory_student_fee_eur_per_semester',
    'semester_contribution_amount_eur'
  ]));
  const applicationFee = toNumber(firstValue(row, [
    'application_fee',
    'registration_fee_eur',
    'application_fee_eur'
  ]));
  const livingCost = toNumber(row.living_cost_per_month, 1100);
  const totalCostEur = toNumber(row.estimated_known_total_cost_eur);
  const officialUrl = firstValue(row, [
    'official_url',
    'student_information_url',
    'canonical_detail_url',
    'studienwahl_detail_url'
  ]);
  const sourceUrl = firstValue(row, [
    'fee_enrichment_source_url',
    'fee_source_url',
    'canonical_detail_url',
    'studienwahl_detail_url',
    'source_catalogue_url',
    'official_url'
  ]) || officialUrl;
  const duration = durationFromRow(row);
  const intakeText = firstValue(row, ['intake', 'intake_semester']) || 'Check official site';
  const deadline = firstValue(row, ['application_deadline', 'application_deadline_international']);
  const deadlineWindow = parseDeadlineWindow(deadline);
  const id = buildProgramId(row, rowIndex, [
    'austria',
    universityName,
    programName,
    city,
    degreeLevel
  ]);

  const affordabilityNotes = [
    totalCostEur ? `Estimated known total cost: EUR ${totalCostEur}` : '',
    row.fee_model ? `Fee model: ${row.fee_model}` : '',
    sourceUrl ? `Fee/source URL: ${sourceUrl}` : ''
  ].filter(Boolean);

  return {
    id,
    program_name: programName,
    university_name: universityName,
    university_id: universityIdMap.get(universityName.toLowerCase()) || null,
    country: 'Austria',
    city,
    degree_level: degreeLevel,
    field_of_study: fieldOfStudy,
    language_of_instruction: firstValue(row, ['language_of_instruction', 'languages_of_instruction']) || 'English',
    tuition_per_semester: tuitionPerSemester,
    tuition_currency: 'EUR',
    tuition_label: tuitionPerSemester === 0 ? 'free' : tuitionPerSemester <= 5000 ? 'low_tuition' : 'paid',
    semester_fee: semesterFee,
    application_fee: applicationFee,
    application_fee_currency: 'EUR',
    has_application_fee: applicationFee > 0,
    living_cost_per_month: livingCost,
    blocked_account_per_year: livingCost * 12,
    application_platform: 'other',
    application_platform_name: 'Austrian university admissions',
    application_platform_url: firstValue(row, ['source_catalogue_url']) || 'https://www.studienwahl.at/',
    direct_application_url: officialUrl || null,
    application_open_date: deadlineWindow.open,
    application_close_date: deadlineWindow.close,
    program_duration_months: duration.months,
    intakes: parseIntakes(row),
    deadline_summary: deadline || 'Check official programme page',
    funding_pathway: tuitionPerSemester > 0 ? 'funding_first' : 'program_first',
    funding_pathway_explanation: tuitionPerSemester > 0
      ? `This Austrian programme is below the EUR 10,000 known-cost threshold, but non-EU tuition or student fees may apply. Confirm the official fee page and pursue scholarships or savings planning before enrollment.`
      : 'This Austrian programme appears to have no tuition in the source data. Focus first on admission, then plan living-cost funding and residence permit funds.',
    min_gpa_4_scale: null,
    language_requirement: 'English',
    english_required: true,
    german_required: false,
    open_to_international: true,
    affordability_notes: affordabilityNotes,
    verified_by: 'Studienwahl Austria export',
    official_source_url: sourceUrl || officialUrl || null,
    full_description_text: firstValue(row, ['content_summary', 'full_description_text']) ||
      `${programName} at ${universityName} is an English-taught ${degreeLevel} programme in ${fieldOfStudy}.`,
    raw_requirements_text: [
      row.entrance_examinations ? `Entrance examinations: ${row.entrance_examinations}` : '',
      row.supplementary_examinations ? `Supplementary examinations: ${row.supplementary_examinations}` : '',
      row.costs_text ? `Costs: ${row.costs_text}` : '',
      row.fee_enrichment_evidence ? `Fee evidence: ${row.fee_enrichment_evidence}` : ''
    ].filter(Boolean).join('\n') || null,
    rubric_criteria: {
      english_level_required: 'Check official programme page',
      german_level_required: false,
      ects: row.ects || null,
      academic_degree: row.academic_degree || null,
      teaching_language_category: row.teaching_language_category || null,
      stay_abroad: row.stay_abroad || null,
      entrance_examinations: row.entrance_examinations || null,
      supplementary_examinations: row.supplementary_examinations || null,
      quality_tier: row.quality_tier || null,
      quality_ready: row.quality_ready || null,
      quality_issues: row.quality_issues || null
    },
    application_steps: buildApplicationSteps(row),
    notes: [
      'Imported from Austria programme CSV',
      row.known_cost_confidence ? `known-cost confidence ${row.known_cost_confidence}` : '',
      row.quality_tier ? `quality tier ${row.quality_tier}` : '',
      row.quality_issues ? `quality issues: ${row.quality_issues}` : ''
    ].filter(Boolean).join('; ') + '.',
    is_active: true,
    intake: intakeText,
    duration: duration.label,
    format: 'On Campus',
    pace: 'Full-time'
  };
}

function validateRows(rows) {
  const errors = [];
  rows.forEach((row, index) => {
    if (!firstValue(row, ['program_name', 'programme_name', 'degree_programme_name'])) {
      errors.push(`Row ${index + 2}: missing program name`);
    }
    if (!firstValue(row, ['university_name'])) {
      errors.push(`Row ${index + 2}: missing university_name`);
    }
    if (!firstValue(row, ['city', 'location'])) {
      errors.push(`Row ${index + 2}: missing city/location`);
    }
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
  const usableRows = rows.filter((row) => {
    const underThreshold = String(row.under_10000_eur_known_total || 'true').toLowerCase() !== 'false';
    const qualityReady = String(row.quality_ready || 'true').toLowerCase() !== 'false';
    return underThreshold && qualityReady;
  });
  const validationErrors = validateRows(usableRows);

  if (validationErrors.length) {
    console.error('CSV validation failed:');
    validationErrors.slice(0, 25).forEach((message) => console.error(`- ${message}`));
    if (validationErrors.length > 25) console.error(`...and ${validationErrors.length - 25} more`);
    process.exit(1);
  }

  const universityMap = new Map();
  for (const row of usableRows) {
    const name = firstValue(row, ['university_name']);
    const key = name.toLowerCase();
    if (!universityMap.has(key)) {
      universityMap.set(key, {
        name,
        city: firstValue(row, ['city', 'location']) || 'Varied',
        type: normalizeUniversityType(row.type_of_higher_education_institution)
      });
    }
  }

  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}`);
  console.log(`CSV: ${CSV_PATH}`);
  console.log(`Replace existing Austria programs: ${REPLACE_COUNTRY ? 'yes' : 'no'}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Importable rows: ${usableRows.length}`);
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
          country: 'Austria',
          city: uni.city,
          type: uni.type,
          tuition_type: 'Low Tuition',
          description: `${uni.name} is an Austrian institution offering English-taught programmes for international students.`,
          living_cost_estimate: 'EUR 1100 / month'
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      universityIdMap.set(key, inserted.id);
    }
  }

  const programs = usableRows.map((row, index) => mapRow(row, universityIdMap, index + 2));
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
  console.log(`Programs with parsed close dates: ${uniquePrograms.filter((program) => program.application_close_date).length}`);
  console.log(`Programs with official/direct links: ${uniquePrograms.filter((program) => program.official_source_url && program.direct_application_url).length}`);
  console.log(`Programs with application steps: ${uniquePrograms.filter((program) => Array.isArray(program.application_steps) && program.application_steps.length > 0).length}`);
  console.log('Sample IDs:');
  uniquePrograms.slice(0, 5).forEach((program) => {
    console.log(`- ${program.id} | ${program.program_name} | ${program.university_name}`);
  });

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to upsert into Supabase.');
    return;
  }

  if (REPLACE_COUNTRY) {
    const { count: existingAustriaCount, error: countError } = await supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('country', 'Austria');

    if (countError) throw countError;

    const { error: deleteError } = await supabase
      .from('programs')
      .delete()
      .eq('country', 'Austria');

    if (deleteError) throw deleteError;
    console.log(`Deleted ${existingAustriaCount || 0} existing Austria program rows before replacement.`);
  }

  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < uniquePrograms.length; i += batchSize) {
    const batch = uniquePrograms.slice(i, i + batchSize);
    const { error } = await supabase
      .from('programs')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) throw error;
    inserted += batch.length;
  }

  console.log(`Import complete. Upserted ${inserted} Austria programs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
