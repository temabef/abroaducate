/**
 * Unified multi-country batch importer for programs extracted by BetterClaw / AI Agents.
 *
 * Reads CSV files matching our 16-column standard schema and upserts universities & programs into Supabase.
 *
 * Usage:
 *   node scripts/import-betterclaw-programs.js --dry-run
 *   node scripts/import-betterclaw-programs.js --apply
 *   node scripts/import-betterclaw-programs.js --apply --csv path/to/file.csv
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const CSV_ARG_INDEX = process.argv.indexOf('--csv');
const CSV_FILE = CSV_ARG_INDEX !== -1 && process.argv[CSV_ARG_INDEX + 1] 
  ? process.argv[CSV_ARG_INDEX + 1] 
  : 'european_degree_programs.csv';
const CSV_PATH = resolve(__dirname, '..', CSV_FILE);

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const parsed = Number.parseFloat(String(value || '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDurationMonths(row) {
  const text = `${row.duration || ''} ${row.duration_semesters || ''}`.toLowerCase();
  const semMatch = text.match(/(\d+)\s*semester/);
  if (semMatch) {
    const s = Number.parseInt(semMatch[1], 10);
    return s > 0 ? s * 6 : 24;
  }
  const monthMatch = text.match(/(\d+)\s*month/);
  if (monthMatch) {
    const m = Number.parseInt(monthMatch[1], 10);
    return m > 0 ? m : 24;
  }
  return 24;
}

function parseCloseDate(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;
  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseIntakes(intakeStr) {
  const text = String(intakeStr || '').toLowerCase();
  const intakes = [];
  if (text.includes('winter') || text.includes('fall') || text.includes('autumn') || text.includes('october') || text.includes('september')) {
    intakes.push('Winter');
  }
  if (text.includes('summer') || text.includes('spring') || text.includes('march') || text.includes('april') || text.includes('february')) {
    intakes.push('Summer');
  }
  return intakes.length > 0 ? intakes : ['Winter'];
}

function normalizeDegree(level) {
  const val = String(level || '').toLowerCase();
  if (val.includes('bachelor') || val.includes('bsc') || val.includes('ba')) return 'bachelor';
  if (val.includes('phd') || val.includes('doctor')) return 'phd';
  return 'master';
}

function buildProgramId(row, index) {
  const country = slugify(row.country || 'europe');
  const uni = slugify(row.university_name || 'unknown-uni');
  const prog = slugify(row.program_name || `program-${index + 1}`);
  const deg = slugify(normalizeDegree(row.degree_level));
  return `${country}-${uni}-${prog}-${deg}`.substring(0, 120);
}

function buildApplicationSteps(row) {
  const platform = String(row.application_platform || 'direct').toLowerCase();
  const isUniAssist = platform.includes('uni-assist');
  const isUniversitaly = platform.includes('universitaly');
  const isSweden = platform.includes('universityadmissions');
  const isFrance = platform.includes('campus_france');

  let portalName = 'the official university application portal';
  if (isUniAssist) portalName = 'uni-assist (VPD / standard online application)';
  else if (isUniversitaly) portalName = 'Universitaly pre-enrolment and the university portal';
  else if (isSweden) portalName = 'UniversityAdmissions.se';
  else if (isFrance) portalName = 'Campus France / Mon Master';

  return [
    {
      step_number: 1,
      title: 'Verify Academic Prerequisites',
      description: 'Check degree certificate, transcript credit requirements, minimum GPA, and syllabus alignment.',
      type: 'document_prep',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 2,
      title: 'Prepare English & Certified Documents',
      description: 'Gather English proficiency proofs (IELTS, TOEFL, or English medium of instruction certificate where accepted) and certified translations.',
      type: 'document_prep',
      estimated_month: 'Before application',
      deadline: ''
    },
    {
      step_number: 3,
      title: 'Submit Application',
      description: `Complete your online submission via ${portalName} and upload required dossiers before the deadline.`,
      type: 'university_deadline',
      estimated_month: row.application_deadline || 'Check official site',
      deadline: row.application_deadline || ''
    },
    {
      step_number: 4,
      title: 'Track Admission & Enrolment',
      description: 'Monitor portal updates, respond to document requests or interviews, and accept admission offer.',
      type: 'university_action',
      estimated_month: 'After submission',
      deadline: ''
    },
    {
      step_number: 5,
      title: 'Prepare Funding and Visa',
      description: 'Secure required visa proof of funds (blocked account / scholarship award), health insurance, and schedule embassy appointment.',
      type: 'visa_prep',
      estimated_month: 'After admission',
      deadline: ''
    }
  ];
}

async function run() {
  console.log(`\n======================================================`);
  console.log(` Abroaducate Multi-Country Program Ingestor`);
  console.log(` Mode: ${APPLY ? 'APPLY (Writing to Supabase)' : 'DRY-RUN (Simulating)'}`);
  console.log(` Source CSV: ${CSV_PATH}`);
  console.log(`======================================================\n`);

  if (!existsSync(CSV_PATH)) {
    console.error(`File not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const rawCsv = readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(rawCsv, { columns: true, skip_empty_lines: true });
  console.log(`Loaded ${rows.length} rows from CSV.\n`);

  if (rows.length === 0) {
    console.log('No rows to import.');
    return;
  }

  // 1. Group and link universities
  const uniMap = new Map();
  for (const r of rows) {
    const name = String(r.university_name || '').trim();
    if (!name) continue;
    const country = String(r.country || 'Europe').trim();
    const city = String(r.city || '').trim();

    if (!uniMap.has(name.toLowerCase())) {
      uniMap.set(name.toLowerCase(), {
        name,
        country,
        city
      });
    }
  }

  console.log(`Identified ${uniMap.size} unique universities.`);
  const universityIdMap = new Map();

  if (APPLY) {
    for (const [key, uni] of uniMap) {
      const { data: existing } = await supabase
        .from('universities')
        .select('id')
        .ilike('name', uni.name)
        .maybeSingle();

      if (existing?.id) {
        universityIdMap.set(key, existing.id);
        console.log(`Found existing university in DB: ${uni.name}`);
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('universities')
        .insert({
          name: uni.name,
          country: uni.country,
          city: uni.city || 'Varied',
          type: 'Public University',
          tuition_type: 'Low/Zero Tuition',
          description: `${uni.name} is an accredited European institution offering English-taught programmes for international students.`,
          living_cost_estimate: `EUR 900 / month`
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error(`Error inserting university ${uni.name}:`, insertErr);
        process.exit(1);
      }
      universityIdMap.set(key, inserted.id);
      console.log(`Created new university record: ${uni.name}`);
    }
  }

  // 2. Map programs
  const programsToUpsert = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const uniName = String(row.university_name || '').trim();
    const uniId = universityIdMap.get(uniName.toLowerCase()) || null;
    const tuition = toNumber(row.tuition_per_semester, 0);
    const livingCost = toNumber(row.living_cost_per_month, 900);
    const appFee = toNumber(row.application_fee, 0);
    const durationMonths = parseDurationMonths(row);
    const closeDate = parseCloseDate(row.application_deadline);
    const progId = buildProgramId(row, i);

    const progRecord = {
      id: progId,
      program_name: String(row.program_name || '').trim(),
      university_name: uniName,
      university_id: uniId,
      country: String(row.country || 'Europe').trim(),
      city: String(row.city || '').trim(),
      degree_level: normalizeDegree(row.degree_level),
      field_of_study: String(row.field_of_study || 'Various').trim(),
      language_of_instruction: String(row.language_of_instruction || 'English').trim(),
      tuition_per_semester: tuition,
      tuition_currency: 'EUR',
      tuition_label: tuition === 0 ? 'free' : tuition <= 3000 ? 'low_tuition' : 'paid',
      semester_fee: 0,
      application_fee: appFee,
      application_fee_currency: 'EUR',
      has_application_fee: appFee > 0,
      living_cost_per_month: livingCost,
      blocked_account_per_year: Math.round(livingCost * 12 * 100) / 100,
      application_platform: 'direct',
      direct_application_url: row.official_url || row.source_url || null,
      official_source_url: row.source_url || row.official_url || null,
      application_close_date: closeDate,
      program_duration_months: durationMonths,
      intakes: parseIntakes(row.intake),
      deadline_summary: row.application_deadline ? `Deadline: ${row.application_deadline}` : null,
      funding_pathway: tuition > 0 ? 'funding_first' : 'program_first',
      funding_pathway_explanation: tuition > 0 
        ? 'This programme has tuition fees for international students. Plan funding alongside scholarship applications.' 
        : 'Tuition-free in public source data. Focus funding on living expenses and visa proof of funds.',
      language_requirement: 'English',
      english_required: true,
      german_required: false,
      open_to_international: true,
      affordability_notes: [`Estimated living cost per month: EUR ${livingCost}`],
      application_steps: buildApplicationSteps(row),
      notes: 'Imported from AI Agent multi-country ingestion.',
      is_active: true,
      intake: String(row.intake || 'Winter').trim(),
      duration: String(row.duration || `${durationMonths} months`).trim(),
      format: 'On Campus',
      pace: 'Full-time',
      created_at: new Date().toISOString()
    };

    programsToUpsert.push(progRecord);
  }

  console.log(`Mapped ${programsToUpsert.length} program records ready for upsert.`);

  if (!APPLY) {
    console.log(`\nSample mapped record (DRY RUN):`);
    console.dir(programsToUpsert[0], { depth: 2 });
    console.log(`\nRun with --apply to commit these ${programsToUpsert.length} programs to Supabase.`);
    return;
  }

  // 3. Batch upsert into Supabase
  const batchSize = 25;
  let inserted = 0;
  for (let i = 0; i < programsToUpsert.length; i += batchSize) {
    const chunk = programsToUpsert.slice(i, i + batchSize);
    const { error: progErr } = await supabase.from('programs').upsert(chunk, { onConflict: 'id' });
    if (progErr) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, progErr);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Ingested ${inserted}/${programsToUpsert.length} programs...`);
  }

  console.log(`\n🎉 Success! All ${inserted} programs successfully imported into Supabase database.`);
}

run().catch((err) => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
