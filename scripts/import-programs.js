/**
 * import-programs.js
 * 
 * Imports verified German university programs from CSV files into Supabase.
 * 
 * Usage:  node scripts/import-programs.js
 * 
 * What it does:
 *   1. Reads both CSV files (free + under-10k)
 *   2. De-duplicates by program_name + university_name
 *   3. Deletes all existing programs & universities (placeholder data)
 *   4. Creates university records (de-duplicated)
 *   5. Inserts all programs in batches
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ── Setup ──────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CSV File Paths ─────────────────────────────────────────────────────────────
const FREE_CSV = resolve(__dirname, '..', 'abroaducate_programmes_fee_ready.csv');
const PAID_CSV = resolve(__dirname, '..', 'abroaducate_programmes_under_10000_known_total.csv');

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function compositeKey(row) {
  return `${(row.program_name || '').trim().toLowerCase()}|||${(row.university_name || '').trim().toLowerCase()}`;
}

function parseDurationMonths(durationStr) {
  if (!durationStr) return 24;
  const match = durationStr.match(/(\d+)\s*semester/i);
  if (match) return parseInt(match[1]) * 6;
  const monthMatch = durationStr.match(/(\d+)\s*month/i);
  if (monthMatch) return parseInt(monthMatch[1]);
  return 24;
}

function parseIntakes(intakeStr) {
  if (!intakeStr) return ['Winter'];
  const intakes = [];
  if (/winter/i.test(intakeStr)) intakes.push('Winter');
  if (/summer/i.test(intakeStr)) intakes.push('Summer');
  return intakes.length > 0 ? intakes : ['Winter'];
}

function normalizeDegreeLevel(level) {
  if (!level) return 'master';
  const l = level.toLowerCase().trim();
  if (l.includes('bachelor')) return 'bachelor';
  if (l.includes('master')) return 'master';
  if (l.includes('phd') || l.includes('doctor')) return 'phd';
  return 'master';
}

function determineTuitionLabel(tuitionPerSemester) {
  if (tuitionPerSemester === 0) return 'free';
  if (tuitionPerSemester <= 1500) return 'low_tuition';
  return 'paid';
}

function cleanFieldOfStudy(raw) {
  if (!raw) return 'Various';
  // The CSV field_of_study often contains long descriptions. Extract just the main field.
  // If it contains "Focus" or "Target group", trim to just the part before that.
  let cleaned = raw.trim();
  const focusIdx = cleaned.indexOf(' Focus ');
  if (focusIdx > 0) cleaned = cleaned.substring(0, focusIdx);
  const targetIdx = cleaned.indexOf(' Target group');
  if (targetIdx > 0) cleaned = cleaned.substring(0, targetIdx);
  // Truncate to reasonable length
  if (cleaned.length > 100) cleaned = cleaned.substring(0, 100);
  return cleaned || 'Various';
}

// ── CSV → Program Row Mapper ───────────────────────────────────────────────────

function mapCsvToProgram(row, universityIdMap) {
  const programName = (row.program_name || '').trim();
  const universityName = (row.university_name || '').trim();
  const city = (row.city || '').trim();
  const tuitionPerSemester = parseFloat(row.non_eu_tuition_eur_per_semester_estimate) || 0;
  const semesterFee = parseFloat(row.semester_contribution_amount_eur) || 0;
  const applicationFee = parseFloat(row.application_fee_eur) || 0;

  // Build a unique slug
  const slug = slugify(`${universityName}-${programName}`);

  const universityId = universityIdMap.get(universityName.toLowerCase()) || null;

  return {
    id: slug,
    program_name: programName,
    university_name: universityName,
    university_id: universityId,
    country: 'Germany',
    city: city || '',
    degree_level: normalizeDegreeLevel(row.degree_level),
    field_of_study: cleanFieldOfStudy(row.field_of_study),
    language_of_instruction: 'English',
    tuition_per_semester: tuitionPerSemester,
    tuition_currency: 'EUR',
    tuition_label: determineTuitionLabel(tuitionPerSemester),
    semester_fee: semesterFee,
    application_fee: applicationFee,
    has_application_fee: applicationFee > 0,
    living_cost_per_month: 934,
    blocked_account_per_year: 11208,
    application_platform: 'direct',
    direct_application_url: (row.actual_program_url || row.official_programme_url || '').trim() || null,
    program_duration_months: parseDurationMonths(row.duration),
    intakes: JSON.stringify(parseIntakes(row.intake_semester)),
    deadline_summary: (row.application_deadline_international || '').trim() || null,
    funding_pathway: 'program_first',
    funding_pathway_explanation: tuitionPerSemester === 0
      ? `This program has €0 tuition. Focus on getting admitted first, then secure living cost funding through scholarships or part-time work.`
      : `This program has affordable tuition of €${tuitionPerSemester}/semester. Apply for the program first, then explore scholarship options for tuition and living costs.`,
    english_required: true,
    german_required: row.german_level_required ? true : false,
    open_to_international: true,
    rubric_criteria: JSON.stringify({
      english_level_required: (row.english_level_required || '').trim() || 'Check official site',
      german_level_required: row.german_level_required ? true : false
    }),
    application_steps: JSON.stringify([]),
    official_source_url: (row.fee_source_url || row.actual_program_url || '').trim() || null,
    raw_requirements_text: (row.tuition_raw_text || '').trim() || null,
    is_active: true,
    // New studee-style fields
    intake: (row.intake_semester || '').trim() || 'Winter Semester',
    duration: (row.duration || '').trim() || null,
    format: (row.study_format || '').trim() || 'On Campus',
    pace: (row.pace || '').trim() || 'Full-time'
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting German Programs Import...\n');

  // ── 1. Read CSVs ──────────────────────────────────────────────────────────
  console.log('📄 Reading CSV files...');

  const freeRaw = readFileSync(FREE_CSV, 'utf-8');
  const freeRows = parse(freeRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  console.log(`   Free/Low-tuition CSV: ${freeRows.length} rows`);

  const paidRaw = readFileSync(PAID_CSV, 'utf-8');
  const paidRows = parse(paidRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  console.log(`   Under-10k CSV: ${paidRows.length} rows`);

  // ── 2. De-duplicate ───────────────────────────────────────────────────────
  console.log('\n🔍 De-duplicating programs...');
  const programMap = new Map();

  // Insert free rows first
  for (const row of freeRows) {
    const key = compositeKey(row);
    if (key === '|||') continue; // skip empty rows
    programMap.set(key, row);
  }
  const freeCount = programMap.size;

  // Overlay paid rows (they have more data: estimated_known_total_cost_eur)
  let overwritten = 0;
  let newFromPaid = 0;
  for (const row of paidRows) {
    const key = compositeKey(row);
    if (key === '|||') continue;
    if (programMap.has(key)) {
      overwritten++;
    } else {
      newFromPaid++;
    }
    programMap.set(key, row); // prefer paid data (more fields)
  }

  console.log(`   Unique from free CSV: ${freeCount}`);
  console.log(`   Overwritten by paid CSV: ${overwritten}`);
  console.log(`   New from paid CSV: ${newFromPaid}`);
  console.log(`   ✅ Total unique programs: ${programMap.size}`);

  // ── 3. Extract unique universities ────────────────────────────────────────
  console.log('\n🏛️  Extracting universities...');
  const universityMap = new Map(); // name_lower → { name, city, country }

  for (const row of programMap.values()) {
    const name = (row.university_name || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!universityMap.has(key)) {
      universityMap.set(key, {
        name,
        city: (row.city || '').trim(),
        country: 'Germany'
      });
    }
  }
  console.log(`   ✅ Found ${universityMap.size} unique universities`);

  // ── 4. Clear existing data ────────────────────────────────────────────────
  console.log('\n🗑️  Clearing existing placeholder data...');

  // Delete user_program_interactions first (FK constraint)
  const { error: interErr } = await supabase.from('user_program_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (interErr) console.warn('   ⚠️ Could not clear interactions:', interErr.message);
  else console.log('   ✅ Cleared user_program_interactions');

  // Delete programs
  const { error: progErr } = await supabase.from('programs').delete().neq('id', '');
  if (progErr) console.warn('   ⚠️ Could not clear programs:', progErr.message);
  else console.log('   ✅ Cleared programs');

  // Delete universities
  const { error: uniErr } = await supabase.from('universities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (uniErr) console.warn('   ⚠️ Could not clear universities:', uniErr.message);
  else console.log('   ✅ Cleared universities');

  // ── 5. Insert universities ────────────────────────────────────────────────
  console.log('\n🏛️  Inserting universities...');
  const universityIdMap = new Map(); // name_lower → uuid

  for (const [key, uni] of universityMap) {
    const tuitionType = (() => {
      // Check if any program from this university has tuition
      for (const row of programMap.values()) {
        if ((row.university_name || '').trim().toLowerCase() === key) {
          const t = parseFloat(row.non_eu_tuition_eur_per_semester_estimate) || 0;
          if (t > 0) return 'Low Tuition';
        }
      }
      return 'Zero Tuition';
    })();

    const { data, error } = await supabase
      .from('universities')
      .insert({
        name: uni.name,
        country: uni.country,
        city: uni.city,
        type: 'Public University',
        tuition_type: tuitionType,
        description: `${uni.name} is a leading German institution offering international programs in ${uni.city || 'Germany'}.`,
        living_cost_estimate: '€934 / month'
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`   ⚠️ Failed to insert university ${uni.name}:`, error.message);
    } else if (data) {
      universityIdMap.set(key, data.id);
    }
  }
  console.log(`   ✅ Inserted ${universityIdMap.size} universities`);

  // ── 6. Build program rows ─────────────────────────────────────────────────
  console.log('\n📝 Mapping programs to database schema...');
  const programRows = [];
  const slugsSeen = new Set();

  for (const row of programMap.values()) {
    const mapped = mapCsvToProgram(row, universityIdMap);

    // Ensure unique slugs
    let finalSlug = mapped.id;
    let counter = 2;
    while (slugsSeen.has(finalSlug)) {
      finalSlug = `${mapped.id}-${counter}`;
      counter++;
    }
    slugsSeen.add(finalSlug);
    mapped.id = finalSlug;

    programRows.push(mapped);
  }
  console.log(`   ✅ Mapped ${programRows.length} programs`);

  // ── 7. Batch insert programs ──────────────────────────────────────────────
  console.log('\n📦 Inserting programs in batches...');
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < programRows.length; i += BATCH_SIZE) {
    const batch = programRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('programs')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      // Try individual inserts for this batch
      for (const program of batch) {
        const { error: singleErr } = await supabase
          .from('programs')
          .upsert(program, { onConflict: 'id', ignoreDuplicates: false });
        if (singleErr) {
          console.error(`      ❌ ${program.program_name}: ${singleErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      process.stdout.write(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(programRows.length / BATCH_SIZE)} (${inserted} programs inserted)\r`);
    }
  }

  // ── 8. Verification ───────────────────────────────────────────────────────
  console.log('\n\n📊 Verifying import...');

  const { count: progCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
  const { count: uniCount } = await supabase.from('universities').select('*', { count: 'exact', head: true });

  console.log(`\n${'═'.repeat(50)}`);
  console.log('🎉 IMPORT COMPLETE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`   Universities in DB: ${uniCount}`);
  console.log(`   Programs in DB:     ${progCount}`);
  console.log(`   Successfully inserted: ${inserted}`);
  console.log(`   Errors: ${errors}`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
