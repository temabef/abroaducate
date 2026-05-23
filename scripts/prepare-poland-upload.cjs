const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, 'poland_final_upload.csv');
const OUTPUT_PATH = path.join(ROOT, 'poland_final_upload_cleaned.csv');
const REPORT_PATH = path.join(ROOT, 'scratch', 'poland_upload_readiness_report_2026-05-10.md');
const DURATION_REVIEW_PATH = path.join(ROOT, 'scratch', 'poland_duration_fixes_review_2026-05-10.csv');
const DEADLINE_REVIEW_PATH = path.join(ROOT, 'scratch', 'poland_deadlines_cleared_review_2026-05-10.csv');
const MODE_REVIEW_PATH = path.join(ROOT, 'scratch', 'poland_delivery_mode_review_2026-05-10.csv');

const TODAY = '2026-05-10';
const WORD_NUMBERS = new Map([
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
  ['ten', 10],
  ['eleven', 11],
  ['twelve', 12]
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((record) => record.some((value) => String(value || '').trim() !== ''));
}

function encodeCsvValue(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => encodeCsvValue(row[header])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProgramSlug(record, seenSlugs) {
  const base = slugify(
    [
      record.country || 'program',
      record.university_name,
      record.program_name,
      record.city,
      record.degree_level
    ]
      .filter(Boolean)
      .join('-')
  );

  const prefix = (base || 'program').slice(0, 110);
  let slug = prefix;
  let counter = 2;

  while (seenSlugs.has(slug)) {
    const suffix = `-${counter}`;
    slug = `${prefix.slice(0, 120 - suffix.length)}${suffix}`;
    counter += 1;
  }

  seenSlugs.add(slug);
  return slug;
}

function parseNumberLike(text) {
  const trimmed = String(text || '').trim().toLowerCase();
  if (!trimmed) return null;

  const numericMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (numericMatch) return Number.parseFloat(numericMatch[1]);

  for (const [word, value] of WORD_NUMBERS.entries()) {
    if (trimmed.includes(word)) return value;
  }

  return null;
}

function inferDurationMonths(durationText) {
  const text = String(durationText || '').trim().toLowerCase();
  if (!text) return null;

  const amount = parseNumberLike(text);
  if (amount === null) return null;

  if (text.includes('semester')) return Math.round(amount * 6);
  if (text.includes('year')) return Math.round(amount * 12);
  if (text.includes('month')) return Math.round(amount);
  return null;
}

function isStaleDeadline(deadline) {
  const value = String(deadline || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value < TODAY;
}

function inferFormat(record) {
  const haystack = [
    record.program_name,
    record.full_description_text,
    record.official_url,
    record.direct_application_url
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/\bhybrid\b|\bblended\b/.test(haystack)) return { value: 'Hybrid', confidence: 'keyword' };
  if (/\bonline\b|on-line|distance learning|remote learning|e-learning/.test(haystack)) {
    return { value: 'Online', confidence: 'keyword' };
  }

  return { value: 'On Campus', confidence: 'default' };
}

function inferPace(record) {
  const haystack = [
    record.program_name,
    record.full_description_text,
    record.official_url,
    record.direct_application_url
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/\bpart-time\b|\bweekend\b|\bextramural\b/.test(haystack)) {
    return { value: 'Part-time', confidence: 'keyword' };
  }
  if (/\bfull-time\b/.test(haystack)) {
    return { value: 'Full-time', confidence: 'keyword' };
  }

  return { value: 'Full-time', confidence: 'default' };
}

function main() {
  const input = fs.readFileSync(INPUT_PATH, 'utf8');
  const parsed = parseCsv(input);
  const headers = parsed[0];
  const rows = parsed.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  );

  const seenSlugs = new Set();
  const durationReview = [];
  const deadlineReview = [];
  const modeReview = [];

  let clearedDeadlines = 0;
  let filledDurationMonths = 0;
  let directLinksBackfilled = 0;
  let formatKeywordOverrides = 0;
  let paceKeywordOverrides = 0;
  let blankSemesterFee = 0;
  let blankApplicationFee = 0;
  let httpOfficialLinks = 0;

  const outputHeaders = [
    'id',
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
    'application_deadline',
    'format',
    'pace'
  ];

  const cleanedRows = rows.map((row) => {
    const cleaned = { ...row };
    cleaned.id = buildProgramSlug(cleaned, seenSlugs);

    if (!String(cleaned.direct_application_url || '').trim()) {
      cleaned.direct_application_url = String(cleaned.official_url || cleaned.source_url || '').trim();
      if (cleaned.direct_application_url) directLinksBackfilled += 1;
    }

    const originalDeadline = String(cleaned.application_deadline || '').trim();
    if (isStaleDeadline(originalDeadline)) {
      cleaned.application_deadline = '';
      clearedDeadlines += 1;
      deadlineReview.push({
        id: cleaned.id,
        program_name: cleaned.program_name,
        university_name: cleaned.university_name,
        original_deadline: originalDeadline,
        action_taken: 'Cleared stale deadline'
      });
    }

    if (!String(cleaned.program_duration_months || '').trim()) {
      const inferredMonths = inferDurationMonths(cleaned.duration);
      if (inferredMonths !== null) {
        cleaned.program_duration_months = String(inferredMonths);
        filledDurationMonths += 1;
        durationReview.push({
          id: cleaned.id,
          program_name: cleaned.program_name,
          university_name: cleaned.university_name,
          duration: cleaned.duration,
          inferred_program_duration_months: String(inferredMonths)
        });
      }
    }

    const format = inferFormat(cleaned);
    const pace = inferPace(cleaned);
    cleaned.format = format.value;
    cleaned.pace = pace.value;

    if (format.confidence === 'keyword' || pace.confidence === 'keyword') {
      modeReview.push({
        id: cleaned.id,
        program_name: cleaned.program_name,
        university_name: cleaned.university_name,
        inferred_format: cleaned.format,
        format_rule: format.confidence,
        inferred_pace: cleaned.pace,
        pace_rule: pace.confidence
      });
    }

    if (format.confidence === 'keyword') formatKeywordOverrides += 1;
    if (pace.confidence === 'keyword') paceKeywordOverrides += 1;

    if (!String(cleaned.semester_fee || '').trim()) blankSemesterFee += 1;
    if (!String(cleaned.application_fee || '').trim()) blankApplicationFee += 1;
    if (/^http:\/\//i.test(String(cleaned.official_url || '').trim())) httpOfficialLinks += 1;

    return cleaned;
  });

  writeCsv(OUTPUT_PATH, outputHeaders, cleanedRows);
  writeCsv(DURATION_REVIEW_PATH, ['id', 'program_name', 'university_name', 'duration', 'inferred_program_duration_months'], durationReview);
  writeCsv(DEADLINE_REVIEW_PATH, ['id', 'program_name', 'university_name', 'original_deadline', 'action_taken'], deadlineReview);
  writeCsv(MODE_REVIEW_PATH, ['id', 'program_name', 'university_name', 'inferred_format', 'format_rule', 'inferred_pace', 'pace_rule'], modeReview);

  const report = `# Poland Upload Readiness Report

Date: 2026-05-10

## Output files

- Cleaned upload file: \`poland_final_upload_cleaned.csv\`
- Duration fix review: \`scratch/poland_duration_fixes_review_2026-05-10.csv\`
- Deadline cleanup review: \`scratch/poland_deadlines_cleared_review_2026-05-10.csv\`
- Delivery mode review: \`scratch/poland_delivery_mode_review_2026-05-10.csv\`

## Safe fixes applied

- Added deterministic \`id\` slugs for all ${cleanedRows.length} rows
- Backfilled \`direct_application_url\` from \`official_url\` or \`source_url\` for ${directLinksBackfilled} rows
- Cleared ${clearedDeadlines} stale deadlines older than ${TODAY}
- Filled \`program_duration_months\` for ${filledDurationMonths} rows from the text in \`duration\`
- Added \`format\` and \`pace\` columns for all rows
- Applied ${formatKeywordOverrides} keyword-based format overrides and ${paceKeywordOverrides} keyword-based pace overrides

## Remaining data issues before a fully trusted production import

- ${blankSemesterFee} rows still have blank \`semester_fee\`
- ${blankApplicationFee} rows still have blank \`application_fee\`
- ${httpOfficialLinks} rows still use \`http\` official URLs

## Important importer behavior

- Blank \`semester_fee\` becomes \`0\` in the current importer
- Blank \`application_fee\` becomes \`0\` in the current importer
- The cleaned file now includes explicit \`format\` and \`pace\` values, so it will not rely on importer defaults for those fields

## Recommendation

- Safe to upload if you accept missing fee fields landing as \`0\` on the platform
- Not fully fee-clean yet for production-grade accuracy without a fee verification pass
`;

  fs.writeFileSync(REPORT_PATH, `${report}\n`, 'utf8');

  console.log(JSON.stringify({
    rows: cleanedRows.length,
    output: path.basename(OUTPUT_PATH),
    clearedDeadlines,
    filledDurationMonths,
    directLinksBackfilled,
    formatKeywordOverrides,
    paceKeywordOverrides,
    blankSemesterFee,
    blankApplicationFee
  }, null, 2));
}

main();
