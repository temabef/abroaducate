/**
 * Import low-cost Swedish Master's programs into Supabase.
 *
 * This is additive: it upserts Sweden universities and programs without
 * deleting or rebuilding the existing Germany catalog.
 *
 * Usage:
 *   node scripts/import-sweden-programs.js --dry-run
 *   node scripts/import-sweden-programs.js --apply
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const CSV_PATH = resolve(__dirname, '..', 'sweden_programmes_under_10000_eur.csv');
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (APPLY && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = APPLY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function slugify(text) {
  return text
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

function sekToEur(sek, rate) {
  const amount = toNumber(sek);
  const fxRate = toNumber(rate);
  if (!amount || !fxRate) return 0;
  return Math.round((amount / fxRate) * 100) / 100;
}

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('oppen')) return 'Open';
  if (value.includes('stangd')) return 'Closed';
  if (value.includes('avslutad')) return 'Closed';
  return status || 'Check official site';
}

function normalizeDegreeLevel(level) {
  const value = String(level || '').toLowerCase();
  if (value.includes('bachelor')) return 'bachelor';
  if (value.includes('phd') || value.includes('doctor')) return 'phd';
  return 'master';
}

function formatPace(row) {
  const percent = toNumber(row.study_pace_percent);
  if (!percent) return 'Full-time';
  return percent >= 100 ? 'Full-time' : `${percent}% pace`;
}

function formatStudyFormat(teachingForm) {
  const value = String(teachingForm || '').toLowerCase();
  if (value.includes('distance')) return 'Distance';
  if (value.includes('on-campus')) return 'On Campus';
  return teachingForm || 'On Campus';
}

function durationFromCredits(row) {
  const credits = toNumber(row.credits);
  if (!credits) return { label: '', months: 24 };
  const months = Math.max(6, Math.round((credits / 60) * 12));
  const creditsLabel = Number.isInteger(credits) ? String(credits) : String(credits);
  return {
    label: `${creditsLabel} ${row.credits_unit || 'credits'}`.replace('.0', ''),
    months
  };
}

function deadlineSummary(row) {
  const status = normalizeStatus(row.status);
  const open = row.application_opens || '';
  const close = row.application_closes || '';
  if (open && close) return `${status}: ${open} to ${close}`;
  if (close) return `${status}: closes ${close}`;
  return `${status}: check University Admissions Sweden`;
}

function buildApplicationSteps(row) {
  const closeDate = row.application_closes || '';
  const openDate = row.application_opens || '';
  return [
    {
      step_number: 1,
      title: 'Confirm Eligibility',
      description: `Review the official ${row.university_name} program page and confirm subject, credit, and English requirements.`,
      type: 'university_action',
      estimated_month: openDate ? new Date(openDate).toLocaleString('en-US', { month: 'long' }) : 'Before applications open',
      deadline: ''
    },
    {
      step_number: 2,
      title: 'Prepare University Admissions Sweden Account',
      description: 'Create or update your University Admissions Sweden profile and gather transcripts, degree documents, and proof of English.',
      type: 'university_action',
      estimated_month: openDate ? new Date(openDate).toLocaleString('en-US', { month: 'long' }) : 'Application window',
      deadline: ''
    },
    {
      step_number: 3,
      title: 'Submit Programme Application',
      description: `Submit the application for ${row.program_name} through University Admissions Sweden before the listed round closes.`,
      type: 'university_deadline',
      estimated_month: closeDate ? new Date(closeDate).toLocaleString('en-US', { month: 'long' }) : 'Check official site',
      deadline: closeDate
    },
    {
      step_number: 4,
      title: 'Pay Application Fee and Upload Documents',
      description: 'Non-EU applicants should budget for the standard application fee and upload all required documentation before the document deadline.',
      type: 'university_action',
      estimated_month: closeDate ? new Date(closeDate).toLocaleString('en-US', { month: 'long' }) : 'After submission',
      deadline: ''
    },
    {
      step_number: 5,
      title: 'Plan Funding and Residence Permit',
      description: 'After admission, confirm tuition payment timing, scholarship outcomes, and Swedish residence permit proof-of-funds requirements.',
      type: 'visa_prep',
      estimated_month: 'After admission results',
      deadline: ''
    }
  ];
}

function mapRow(row, universityIdMap) {
  const programName = String(row.program_name || '').trim();
  const universityName = String(row.university_name || '').trim();
  const city = String(row.location || '').trim();
  const tuitionPerSemester = sekToEur(row.first_tuition_fee_sek, row.ecb_sek_per_eur);
  const applicationFee = sekToEur(row.application_fee_sek, row.ecb_sek_per_eur);
  const duration = durationFromCredits(row);
  const officialUrl = String(row.official_programme_url || '').trim();
  const applicationClose = row.application_closes || null;
  const applicationOpen = row.application_opens || null;
  const totalCostEur = toNumber(row.estimated_known_total_cost_eur);
  const slug = slugify(`${universityName}-${programName}-${row.application_code || ''}`);

  return {
    id: slug,
    program_name: programName,
    university_name: universityName,
    university_id: universityIdMap.get(universityName.toLowerCase()) || null,
    country: 'Sweden',
    city: city || 'Varied',
    degree_level: normalizeDegreeLevel(row.degree_level),
    field_of_study: String(row.subject_areas || 'Various').split('|')[0].trim() || 'Various',
    language_of_instruction: row.language_of_instruction || 'English',
    tuition_per_semester: tuitionPerSemester,
    tuition_currency: 'EUR',
    tuition_label: tuitionPerSemester === 0 ? 'free' : tuitionPerSemester <= 5000 ? 'low_tuition' : 'paid',
    semester_fee: 0,
    application_fee: applicationFee,
    application_fee_currency: 'EUR',
    has_application_fee: applicationFee > 0,
    living_cost_per_month: 950,
    blocked_account_per_year: 11400,
    application_platform: 'other',
    application_platform_name: 'University Admissions Sweden',
    application_platform_url: 'https://www.universityadmissions.se/',
    direct_application_url: officialUrl || null,
    application_open_date: applicationOpen,
    application_close_date: applicationClose,
    program_duration_months: duration.months,
    intakes: ['Autumn'],
    deadline_summary: deadlineSummary(row),
    funding_pathway: 'funding_first',
    funding_pathway_explanation: totalCostEur
      ? `This Swedish programme is under the EUR 10,000 known-cost threshold, but tuition still applies for many non-EU students. Apply through University Admissions Sweden while pursuing Swedish Institute, university, and external scholarships early.`
      : 'Apply through University Admissions Sweden while pursuing national, university, and external scholarships early.',
    min_gpa_4_scale: null,
    language_requirement: 'English',
    english_required: true,
    german_required: false,
    open_to_international: true,
    affordability_notes: [
      `Estimated known total cost: EUR ${totalCostEur || 'check official site'}`,
      `Source FX rate: ${row.ecb_sek_per_eur || 'not provided'} SEK/EUR on ${row.fx_rate_date || 'unknown date'}`
    ],
    last_verified_date: row.fx_rate_date || null,
    verified_by: 'University Admissions Sweden export',
    official_source_url: officialUrl || null,
    full_description_text: `${programName} at ${universityName} is an English-taught ${duration.label || 'Master'} programme in ${row.subject_areas || 'its field'}. It is included because its known non-EU tuition/application-fee total is below EUR 10,000 based on the source catalogue.`,
    raw_requirements_text: `Application code: ${row.application_code || 'not provided'}. Admissions round: ${row.admissions_round_code || 'not provided'}. Status: ${normalizeStatus(row.status)}.`,
    rubric_criteria: {
      english_level_required: 'Check official programme page',
      german_level_required: false,
      application_code: row.application_code || null,
      admissions_round_code: row.admissions_round_code || null,
      sweden_status: normalizeStatus(row.status),
      credits: row.credits || null,
      subject_areas: row.subject_areas || null
    },
    application_steps: buildApplicationSteps(row),
    notes: `Imported from ${row.source_catalogue || 'Sweden catalogue'}; source status ${row.status || 'unknown'}.`,
    is_active: true,
    intake: row.term_name || 'Autumn 2026',
    duration: duration.label || null,
    format: formatStudyFormat(row.teaching_form),
    pace: formatPace(row)
  };
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  const usableRows = rows.filter((row) => String(row.platform_include).toLowerCase() !== 'false');

  const universityMap = new Map();
  for (const row of usableRows) {
    const name = String(row.university_name || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!universityMap.has(key)) {
      universityMap.set(key, {
        name,
        city: String(row.location || '').trim() || 'Varied',
        country: 'Sweden'
      });
    }
  }

  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}`);
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
          country: 'Sweden',
          city: uni.city,
          type: 'Public University',
          tuition_type: 'Low Tuition',
          description: `${uni.name} is a Swedish institution offering English-taught programmes for international students.`,
          living_cost_estimate: 'EUR 950 / month'
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      universityIdMap.set(key, inserted.id);
    }
  }

  const programs = usableRows.map((row) => mapRow(row, universityIdMap));
  const uniquePrograms = [];
  const seenIds = new Set();
  for (const program of programs) {
    let id = program.id;
    let counter = 2;
    while (seenIds.has(id)) {
      id = `${program.id}-${counter}`;
      counter++;
    }
    seenIds.add(id);
    uniquePrograms.push({ ...program, id });
  }

  console.log(`Programs prepared: ${uniquePrograms.length}`);
  console.log('Sample IDs:');
  uniquePrograms.slice(0, 5).forEach((program) => {
    console.log(`- ${program.id} | ${program.program_name} | ${program.university_name}`);
  });

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to upsert into Supabase.');
    return;
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

  console.log(`Import complete. Upserted ${inserted} Sweden programs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
