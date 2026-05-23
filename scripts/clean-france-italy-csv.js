/**
 * Clean the France and Italy program CSVs before importing into Supabase and
 * enforce the platform's "low / no tuition" rule (total tuition <= EUR 10,000).
 *
 * What this script does:
 *   1. Reads france_final_upload.csv and italy_final_upload.csv.
 *   2. Normalises whitespace, currency suffixes, and range values.
 *   3. Applies researched tuition patches for rows where the original source
 *      had a corrupted / tiny fee (Paris-Saclay, UCLy, IAE Montpellier, IAE
 *      Aix-Marseille). See TUITION_PATCHES below for the research trail.
 *   4. Drops duplicate rows (same program_name + university_name).
 *   5. Drops every program whose total tuition > EUR 10,000 (where total
 *      tuition = tuition_per_semester * ceil(program_duration_months / 6)).
 *      A program with zero or missing program_duration_months is treated as
 *      a 2-year master (4 semesters) by default.
 *   6. Writes:
 *        france_final_upload_cleaned.csv         - ready to import
 *        italy_final_upload_cleaned.csv          - ready to import
 *        france_final_upload_cleanup_report.csv  - per-field audit trail
 *        italy_final_upload_cleanup_report.csv   - per-field audit trail
 *        france_final_upload_rejected.csv        - rows dropped (with reason)
 *        italy_final_upload_rejected.csv         - rows dropped (with reason)
 *        france_final_upload_manual_review.csv   - rows still needing eyes
 *        italy_final_upload_manual_review.csv    - rows still needing eyes
 *
 * Usage:
 *   node scripts/clean-france-italy-csv.js
 */

import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── CSV helpers ──────────────────────────────────────────────────────────────

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function stringify(rows, { columns }) {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  }
  return lines.join('\n') + '\n';
}

const COLUMN_ORDER = [
  'program_name',
  'university_name',
  'country',
  'city',
  'tuition_per_semester',
  'degree_level',
  'field_of_study',
  'language_of_instruction',
  'semester_fee',
  'application_fee',
  'living_cost_per_month',
  'official_url',
  'direct_application_url',
  'source_url',
  'full_description_text',
  'program_duration_months',
  'duration',
  'intake',
  'application_deadline'
];

// ── Tuition patches (researched 2026-05, documented below) ──────────────────
//
// Each key is `${program_name}|${university_name}`. Values are:
//   - fromValues: raw values we accept as the corrupted original (any match)
//   - toPerSemester: the canonical per-semester tuition in EUR
//   - reason: plain-English justification with source
//
// Rationale:
//   French national Master's registration fee for 2025-26: EUR 254/year
//     = EUR 127/semester (source: service-public.fr, french-property.com).
//   Université Paris-Saclay Board decision: national rate applies flat to
//     EU and non-EU Master students (source: rentree.centralesupelec.fr,
//     mastersportal.com listing M1 Economics at EUR 250/year).
//   French national Bachelor's rate: EUR 175-178/year = ~EUR 89/semester.
//   UCLy LL.M. M1 and M2: EUR 9,500/year (private programme) per lawstudies.com.
//   IAE Aix-Marseille M2 Entrepreneurship/Innovation: formation initiale uses
//     the national Master's rate (EUR 254/year = EUR 127/semester).
//   IAE Montpellier Bachelor L3: national Bachelor rate (EUR 89/semester).
//   IAE Montpellier MBA Digital Business & Innovation: paid executive MBA,
//     exact fee not publicly confirmable in short-form sources. Left flagged
//     for manual review (see MANUAL_REVIEW below) rather than guessed.

const TUITION_PATCHES = new Map();

// Université Paris-Saclay: apply the flat EUR 127/semester national rate to
// every flagged M1/M2 row. We match by university_name to avoid enumerating
// 73 program rows, and only patch when the original value is below 5 EUR.
const PARIS_SACLAY = 'Université Paris-Saclay';
const UCLY = 'Institut catholique de Lyon';
const IAE_MTP = 'IAE - Université Montpellier';
const IAE_AMU = 'IAE - Université d\'Aix-Marseille';

const UNIVERSITY_PATCHES = new Map([
  [
    PARIS_SACLAY,
    {
      toPerSemester: 127,
      reason:
        'French national Master registration fee is EUR 254/year (2025-26). Université Paris-Saclay applies this flat rate to EU and non-EU students per the university board policy (source: centralesupelec.fr rentrée page).'
    }
  ],
  [
    UCLY,
    {
      toPerSemester: 4750,
      reason:
        'UCLy LL.M. tuition is EUR 9,500/year (private programme) per lawstudies.com. Both the M1 LL.M. in International Business Law and the M2 LL.M. in European and International Trade & Investment Law are priced the same.'
    }
  ],
  [
    IAE_AMU,
    {
      toPerSemester: 127,
      reason:
        'IAE Aix-Marseille M2 Management (Entrepreneurship) formation initiale uses the French national Master registration fee (EUR 254/year = EUR 127/semester).'
    }
  ]
]);

// For IAE Montpellier we have two rows with different degree levels, so we
// handle them per program rather than per university.
const PROGRAM_PATCHES = new Map([
  [
    'Bachelor\'s degree (L3) in International Management & Business|IAE - Université Montpellier',
    {
      toPerSemester: 89,
      reason:
        'IAE Montpellier L3 uses the French national Bachelor registration fee (~EUR 178/year = EUR 89/semester).'
    }
  ]
]);

// Rows we keep but flag for the operator to re-check by hand before publish.
const MANUAL_REVIEW_KEYS = new Set([
  'MBA in Digital Business & Innovation|IAE - Université Montpellier'
]);

// Known decimal typo in the original data (documented separately from the
// per-university patches because the value was wildly wrong, not tiny).
const TYPO_FIXES = new Map([
  [
    'Advanced Master in Aviation Safety and Aircraft Airworthiness|Institut Supérieur de l\'Aéronautique et de l\'Espace-Toulouse',
    {
      from: 72500,
      toPerSemester: 7250,
      reason:
        'Likely decimal typo. 72500 is an order of magnitude above every other ISAE Advanced Master, which sit at 8000-9250 EUR/semester.'
    }
  ]
]);

// ── Parsing helpers ─────────────────────────────────────────────────────────

function normaliseWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function cleanString(value) {
  return String(value ?? '').trim();
}

function parseRange(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  // Use unsigned matches: costs/fees are never negative, and a hyphen between
  // two numbers is a range separator (e.g. "600-800 EUR"), not a sign.
  const matches = [...text.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) =>
    Number.parseFloat(match[0].replace(',', '.'))
  );
  if (!matches.length || matches.some((amount) => !Number.isFinite(amount))) return null;
  if (matches.length >= 2) {
    return {
      numeric: Number(((matches[0] + matches[1]) / 2).toFixed(2)),
      isRange: true,
      low: matches[0],
      high: matches[1]
    };
  }
  return { numeric: Number(matches[0].toFixed(2)), isRange: false };
}

function parseNumber(value) {
  const parsed = parseRange(value);
  return parsed ? parsed.numeric : null;
}

function programKey(programName, universityName) {
  return `${programName}|${universityName}`;
}

// ── Row cleaner ─────────────────────────────────────────────────────────────

function cleanRow(rawRow, countryLabel, actionsForRow) {
  const row = { ...rawRow };

  // Whitespace
  const normalisedProgram = normaliseWhitespace(row.program_name);
  const normalisedUniversity = normaliseWhitespace(row.university_name);
  if (normalisedProgram !== row.program_name) {
    actionsForRow.push({
      field: 'program_name',
      before: row.program_name,
      after: normalisedProgram,
      reason: 'Collapsed whitespace.'
    });
  }
  if (normalisedUniversity !== row.university_name) {
    actionsForRow.push({
      field: 'university_name',
      before: row.university_name,
      after: normalisedUniversity,
      reason: 'Collapsed whitespace.'
    });
  }
  row.program_name = normalisedProgram;
  row.university_name = normalisedUniversity;

  // Country
  const country = cleanString(row.country);
  if (country !== countryLabel) {
    actionsForRow.push({
      field: 'country',
      before: row.country,
      after: countryLabel,
      reason: `Standardised country string to "${countryLabel}".`
    });
    row.country = countryLabel;
  }

  // City
  const city = normaliseWhitespace(row.city);
  if (city !== row.city) {
    actionsForRow.push({
      field: 'city',
      before: row.city,
      after: city,
      reason: 'Collapsed whitespace.'
    });
  }
  row.city = city;

  // Degree level casing
  const degreeRaw = cleanString(row.degree_level);
  const degreeLower = degreeRaw.toLowerCase();
  let degreeNormalised = degreeRaw;
  if (degreeLower.includes('bachelor')) degreeNormalised = 'Bachelor';
  else if (degreeLower.includes('master')) degreeNormalised = 'Master';
  else if (degreeLower.includes('phd') || degreeLower.includes('doctor')) degreeNormalised = 'PhD';
  else if (degreeLower.includes('short')) degreeNormalised = 'Short Course';
  if (degreeNormalised !== degreeRaw) {
    actionsForRow.push({
      field: 'degree_level',
      before: row.degree_level,
      after: degreeNormalised,
      reason: 'Standardised degree level casing.'
    });
  }
  row.degree_level = degreeNormalised;

  // tuition_per_semester pipeline: typo fix → program patch → university patch → micro-stub zeroing
  let tuitionValue = parseNumber(row.tuition_per_semester);
  const key = programKey(row.program_name, row.university_name);

  const typo = TYPO_FIXES.get(key);
  if (typo && tuitionValue === typo.from) {
    actionsForRow.push({
      field: 'tuition_per_semester',
      before: row.tuition_per_semester,
      after: String(typo.toPerSemester),
      reason: typo.reason
    });
    tuitionValue = typo.toPerSemester;
  }

  const isMicroStub = tuitionValue !== null && tuitionValue > 0 && tuitionValue < 5;
  if (isMicroStub) {
    const progPatch = PROGRAM_PATCHES.get(key);
    const uniPatch = UNIVERSITY_PATCHES.get(row.university_name);
    if (progPatch) {
      actionsForRow.push({
        field: 'tuition_per_semester',
        before: row.tuition_per_semester,
        after: String(progPatch.toPerSemester),
        reason: progPatch.reason
      });
      tuitionValue = progPatch.toPerSemester;
    } else if (uniPatch) {
      actionsForRow.push({
        field: 'tuition_per_semester',
        before: row.tuition_per_semester,
        after: String(uniPatch.toPerSemester),
        reason: uniPatch.reason
      });
      tuitionValue = uniPatch.toPerSemester;
    } else {
      // Final fallback: not credible, zero it out but flag for manual review
      actionsForRow.push({
        field: 'tuition_per_semester',
        before: row.tuition_per_semester,
        after: '0',
        reason: `Original value ${tuitionValue} is not a credible per-semester tuition and no patch rule matched. Zeroed.`,
        flagForReview: true
      });
      tuitionValue = 0;
    }
  }

  row.tuition_per_semester = tuitionValue !== null ? String(tuitionValue) : '0';

  // semester_fee: numeric or empty
  const semesterFeeRaw = cleanString(row.semester_fee);
  if (semesterFeeRaw) {
    const semesterFeeNumeric = parseNumber(semesterFeeRaw);
    if (semesterFeeNumeric !== null && String(semesterFeeNumeric) !== semesterFeeRaw) {
      actionsForRow.push({
        field: 'semester_fee',
        before: row.semester_fee,
        after: String(semesterFeeNumeric),
        reason: 'Normalised to numeric value.'
      });
      row.semester_fee = String(semesterFeeNumeric);
    }
  } else {
    row.semester_fee = '';
  }

  // application_fee: strip currency suffix
  const appFeeRaw = cleanString(row.application_fee);
  if (appFeeRaw) {
    const appFeeNumeric = parseNumber(appFeeRaw);
    if (appFeeNumeric !== null && String(appFeeNumeric) !== appFeeRaw) {
      actionsForRow.push({
        field: 'application_fee',
        before: row.application_fee,
        after: String(appFeeNumeric),
        reason: 'Stripped currency suffix and normalised to number.'
      });
      row.application_fee = String(appFeeNumeric);
    } else if (appFeeNumeric === null) {
      actionsForRow.push({
        field: 'application_fee',
        before: row.application_fee,
        after: '',
        reason: 'Could not parse application fee; cleared so importer defaults to 0.',
        flagForReview: true
      });
      row.application_fee = '';
    }
  } else {
    row.application_fee = '';
  }

  // living_cost_per_month: range -> midpoint
  const livingRaw = cleanString(row.living_cost_per_month);
  if (livingRaw) {
    const livingParsed = parseRange(livingRaw);
    if (livingParsed && String(livingParsed.numeric) !== livingRaw) {
      actionsForRow.push({
        field: 'living_cost_per_month',
        before: row.living_cost_per_month,
        after: String(livingParsed.numeric),
        reason: livingParsed.isRange
          ? `Converted range ${livingParsed.low}-${livingParsed.high} to midpoint ${livingParsed.numeric}.`
          : 'Stripped currency suffix and normalised to number.'
      });
      row.living_cost_per_month = String(livingParsed.numeric);
    } else if (!livingParsed) {
      actionsForRow.push({
        field: 'living_cost_per_month',
        before: row.living_cost_per_month,
        after: '',
        reason: 'Could not parse living cost; cleared so importer uses country default.',
        flagForReview: true
      });
      row.living_cost_per_month = '';
    }
  }

  // URLs
  for (const urlField of ['official_url', 'direct_application_url', 'source_url']) {
    row[urlField] = cleanString(row[urlField]);
  }

  // program_duration_months
  const durationMonthsRaw = cleanString(row.program_duration_months);
  if (durationMonthsRaw) {
    const durationMonthsNumeric = parseNumber(durationMonthsRaw);
    if (durationMonthsNumeric !== null && String(durationMonthsNumeric) !== durationMonthsRaw) {
      actionsForRow.push({
        field: 'program_duration_months',
        before: row.program_duration_months,
        after: String(durationMonthsNumeric),
        reason: 'Normalised to integer.'
      });
      row.program_duration_months = String(durationMonthsNumeric);
    }
  }

  // Trim remaining text fields
  for (const field of [
    'duration',
    'intake',
    'language_of_instruction',
    'full_description_text',
    'field_of_study',
    'application_deadline'
  ]) {
    row[field] = cleanString(row[field]);
  }

  // Flag for manual review if keyed explicitly
  if (MANUAL_REVIEW_KEYS.has(programKey(row.program_name, row.university_name))) {
    actionsForRow.push({
      field: '__flag__',
      before: '',
      after: 'review',
      reason:
        'Executive MBA pricing could not be verified from public sources. Please confirm tuition manually before publishing.',
      flagForReview: true
    });
  }

  return row;
}

function shapeRow(row) {
  const shaped = {};
  for (const col of COLUMN_ORDER) shaped[col] = row[col] ?? '';
  return shaped;
}

// ── Platform rule: total tuition <= EUR 10,000 ──────────────────────────────

function computeTotalTuition(row) {
  const perSemester = parseNumber(row.tuition_per_semester) || 0;
  const months = parseNumber(row.program_duration_months);
  const semesters = months && months > 0 ? Math.max(1, Math.ceil(months / 6)) : 4;
  return {
    totalEur: perSemester * semesters,
    semesters,
    perSemester
  };
}

// ── Main processor ──────────────────────────────────────────────────────────

function processCsv({ inputPath, outputPath, reportPath, rejectedPath, reviewPath, countryLabel }) {
  const raw = readFileSync(inputPath, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });

  const actions = [];
  const flagged = new Map(); // key -> {row object, reason}
  const seenKeys = new Map();
  const cleanedRows = [];
  const rejected = [];

  rows.forEach((rawRow, idx) => {
    const rowIndex = idx + 2;
    const actionsForRow = [];
    const cleaned = cleanRow(rawRow, countryLabel, actionsForRow);

    const key = `${cleaned.program_name.toLowerCase()}|${cleaned.university_name.toLowerCase()}`;
    if (seenKeys.has(key)) {
      actions.push({
        row: rowIndex,
        program_name: cleaned.program_name,
        university_name: cleaned.university_name,
        field: '__row__',
        before: `Row ${rowIndex}`,
        after: 'DROPPED',
        reason: `Duplicate of row ${seenKeys.get(key)} (same program_name + university_name).`
      });
      rejected.push({
        ...shapeRow(cleaned),
        rejection_reason: `Duplicate of row ${seenKeys.get(key)}`
      });
      return;
    }
    seenKeys.set(key, rowIndex);

    actionsForRow.forEach((action) => {
      actions.push({
        row: rowIndex,
        program_name: cleaned.program_name,
        university_name: cleaned.university_name,
        ...action
      });
      if (action.flagForReview) {
        const rk = programKey(cleaned.program_name, cleaned.university_name);
        if (!flagged.has(rk)) {
          flagged.set(rk, {
            row_index: rowIndex,
            program_name: cleaned.program_name,
            university_name: cleaned.university_name,
            field: action.field,
            before: action.before,
            after: action.after,
            reason: action.reason
          });
        }
      }
    });

    // Enforce the platform's <= EUR 10,000 total tuition rule.
    const { totalEur, semesters, perSemester } = computeTotalTuition(cleaned);
    if (totalEur > 10000) {
      actions.push({
        row: rowIndex,
        program_name: cleaned.program_name,
        university_name: cleaned.university_name,
        field: '__row__',
        before: `tuition_per_semester=${perSemester} x ${semesters} semesters = ${totalEur} EUR`,
        after: 'DROPPED',
        reason: 'Total tuition exceeds platform threshold of EUR 10,000.'
      });
      rejected.push({
        ...shapeRow(cleaned),
        rejection_reason: `Total tuition ${totalEur} EUR > 10000 (${perSemester}/semester x ${semesters} semesters)`
      });
      return;
    }

    cleanedRows.push(shapeRow(cleaned));
  });

  const cleanedCsv = stringify(cleanedRows, { header: true, columns: COLUMN_ORDER });
  writeFileSync(outputPath, cleanedCsv, 'utf-8');

  const reportColumns = ['row', 'program_name', 'university_name', 'field', 'before', 'after', 'reason'];
  writeFileSync(reportPath, stringify(actions, { columns: reportColumns }), 'utf-8');

  const rejectedColumns = [...COLUMN_ORDER, 'rejection_reason'];
  writeFileSync(rejectedPath, stringify(rejected, { columns: rejectedColumns }), 'utf-8');

  const reviewColumns = ['row_index', 'program_name', 'university_name', 'field', 'before', 'after', 'reason'];
  writeFileSync(reviewPath, stringify([...flagged.values()], { columns: reviewColumns }), 'utf-8');

  return {
    inputCount: rows.length,
    outputCount: cleanedRows.length,
    rejectedCount: rejected.length,
    flaggedCount: flagged.size,
    actionsSummary: summariseActions(actions),
    rejectionsSummary: summariseRejections(rejected)
  };
}

function summariseActions(actions) {
  const byField = new Map();
  for (const action of actions) byField.set(action.field, (byField.get(action.field) || 0) + 1);
  return [...byField.entries()].sort((a, b) => b[1] - a[1]).map(([field, count]) => ({ field, count }));
}

function summariseRejections(rejected) {
  const byReason = new Map();
  for (const r of rejected) {
    const reason = /Duplicate/.test(r.rejection_reason)
      ? 'Duplicate row'
      : /> 10000/.test(r.rejection_reason)
        ? 'Total tuition > EUR 10,000'
        : 'Other';
    byReason.set(reason, (byReason.get(reason) || 0) + 1);
  }
  return [...byReason.entries()].map(([reason, count]) => ({ reason, count }));
}

function run() {
  const france = processCsv({
    inputPath: resolve(ROOT, 'france_final_upload.csv'),
    outputPath: resolve(ROOT, 'france_final_upload_cleaned.csv'),
    reportPath: resolve(ROOT, 'france_final_upload_cleanup_report.csv'),
    rejectedPath: resolve(ROOT, 'france_final_upload_rejected.csv'),
    reviewPath: resolve(ROOT, 'france_final_upload_manual_review.csv'),
    countryLabel: 'France'
  });

  const italy = processCsv({
    inputPath: resolve(ROOT, 'italy_final_upload.csv'),
    outputPath: resolve(ROOT, 'italy_final_upload_cleaned.csv'),
    reportPath: resolve(ROOT, 'italy_final_upload_cleanup_report.csv'),
    rejectedPath: resolve(ROOT, 'italy_final_upload_rejected.csv'),
    reviewPath: resolve(ROOT, 'italy_final_upload_manual_review.csv'),
    countryLabel: 'Italy'
  });

  const summary = [
    '',
    '=== Cleanup summary ===',
    '',
    'France:',
    `  input rows: ${france.inputCount}`,
    `  accepted (ready to upload): ${france.outputCount}`,
    `  rejected: ${france.rejectedCount}`,
    `  flagged for manual review: ${france.flaggedCount}`,
    '  rejection reasons:',
    ...france.rejectionsSummary.map((r) => `    - ${r.reason}: ${r.count}`),
    '',
    'Italy:',
    `  input rows: ${italy.inputCount}`,
    `  accepted (ready to upload): ${italy.outputCount}`,
    `  rejected: ${italy.rejectedCount}`,
    `  flagged for manual review: ${italy.flaggedCount}`,
    '  rejection reasons:',
    ...italy.rejectionsSummary.map((r) => `    - ${r.reason}: ${r.count}`),
    '',
    'Output files:',
    '  france_final_upload_cleaned.csv           (import this)',
    '  france_final_upload_rejected.csv          (audit: dropped rows)',
    '  france_final_upload_cleanup_report.csv    (audit: every edit)',
    '  france_final_upload_manual_review.csv     (rows to double-check)',
    '  italy_final_upload_cleaned.csv            (import this)',
    '  italy_final_upload_rejected.csv           (audit: dropped rows)',
    '  italy_final_upload_cleanup_report.csv     (audit: every edit)',
    '  italy_final_upload_manual_review.csv      (rows to double-check)',
    ''
  ].join('\n');

  console.log(summary);
}

run();
