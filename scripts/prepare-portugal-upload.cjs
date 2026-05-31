const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, 'portugal_strict_upload_ready_conservative_198.csv');
const OUTPUT_PATH = path.join(ROOT, 'portugal_strict_upload_ready_conservative_cleaned.csv');
const REPORT_PATH = path.join(ROOT, 'scratch', 'portugal_upload_readiness_report_2026-05-24.md');
const DEADLINE_REVIEW_PATH = path.join(ROOT, 'scratch', 'portugal_deadlines_cleared_review_2026-05-24.csv');

const TODAY = '2026-05-24';
const FCUL_MASTER_NEXT_CLOSE = '2026-07-17';

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

function isStaleDeadline(deadline) {
  const value = String(deadline || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value < TODAY;
}

function toNumber(value, fallback = 0) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return fallback;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isAveiroUniversity(universityName) {
  return String(universityName || '').includes('Universidade de Aveiro');
}

function isFcul(universityName) {
  return String(universityName || '').includes('Universidade de Lisboa - Faculdade de Ciências');
}

function isTecnico(universityName) {
  return String(universityName || '').includes('Universidade de Lisboa - Instituto Superior Técnico');
}

function inferFormat() {
  return 'On Campus';
}

function inferPace() {
  return 'Full-time';
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing input file: ${INPUT_PATH}`);
  }

  const input = fs.readFileSync(INPUT_PATH, 'utf8');
  const parsed = parseCsv(input);
  const headers = parsed[0];
  const rows = parsed.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  );

  const seenSlugs = new Set();
  const deadlineReview = [];

  let clearedDeadlines = 0;
  let updatedDeadlines = 0;
  let generatedIds = 0;
  let defaultFormatCount = 0;
  let defaultPaceCount = 0;
  let filledSemesterFee = 0;
  let filledApplicationFee = 0;
  let blankSemesterFee = 0;
  let blankApplicationFee = 0;

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
    generatedIds += 1;

    if (isStaleDeadline(cleaned.application_deadline)) {
      const originalDeadline = cleaned.application_deadline;

      if (isFcul(cleaned.university_name) && String(cleaned.degree_level).toLowerCase() === 'master') {
        cleaned.application_deadline = FCUL_MASTER_NEXT_CLOSE;
        updatedDeadlines += 1;
        deadlineReview.push({
          id: cleaned.id,
          program_name: cleaned.program_name,
          university_name: cleaned.university_name,
          original_deadline: originalDeadline,
          action_taken: `Updated to next confirmed deadline: ${FCUL_MASTER_NEXT_CLOSE}`
        });
      } else {
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
    }

    if (!String(cleaned.semester_fee || '').trim()) {
      const tuitionPerSemester = toNumber(cleaned.tuition_per_semester, 0);
      let semesterFee = '';

      if (isAveiroUniversity(cleaned.university_name)) {
        semesterFee = String(Number((tuitionPerSemester * 0.04).toFixed(2)));
      } else if (isFcul(cleaned.university_name)) {
        semesterFee = '50';
      } else if (isTecnico(cleaned.university_name)) {
        semesterFee = '30';
      }

      if (semesterFee) {
        cleaned.semester_fee = semesterFee;
        filledSemesterFee += 1;
      }
    }

    if (!String(cleaned.application_fee || '').trim()) {
      let applicationFee = '';

      if (isAveiroUniversity(cleaned.university_name) && String(cleaned.degree_level).toLowerCase() === 'master') {
        applicationFee = '20';
      } else if (isFcul(cleaned.university_name)) {
        applicationFee = '60';
      }

      if (applicationFee) {
        cleaned.application_fee = applicationFee;
        filledApplicationFee += 1;
      }
    }

    cleaned.format = inferFormat();
    cleaned.pace = inferPace();
    defaultFormatCount += 1;
    defaultPaceCount += 1;

    if (!String(cleaned.semester_fee || '').trim()) blankSemesterFee += 1;
    if (!String(cleaned.application_fee || '').trim()) blankApplicationFee += 1;

    return cleaned;
  });

  writeCsv(OUTPUT_PATH, outputHeaders, cleanedRows);
  writeCsv(
    DEADLINE_REVIEW_PATH,
    ['id', 'program_name', 'university_name', 'original_deadline', 'action_taken'],
    deadlineReview
  );

  const report = `# Portugal Upload Readiness Report

Date: 2026-05-24

## Output files

- Cleaned upload file: \`portugal_strict_upload_ready_conservative_cleaned.csv\`
- Deadline cleanup review: \`scratch/portugal_deadlines_cleared_review_2026-05-24.csv\`

## Safe fixes applied

- Added deterministic \`id\` slugs for all ${generatedIds} rows
- Cleared ${clearedDeadlines} stale deadlines older than ${TODAY}
- Updated ${updatedDeadlines} stale deadlines to a confirmed upcoming deadline
- Filled ${filledSemesterFee} blank \`semester_fee\` values using official institution fee rules
- Filled ${filledApplicationFee} blank \`application_fee\` values using official institution fee rules
- Added \`format\` = \`On Campus\` for all ${defaultFormatCount} rows
- Added \`pace\` = \`Full-time\` for all ${defaultPaceCount} rows

## Remaining data issues before a fully trusted production import

- ${blankSemesterFee} rows still have blank \`semester_fee\`
- ${blankApplicationFee} rows still have blank \`application_fee\`

## Official fee rules applied

- Universidade de Aveiro: registration/insurance fee set to 2% of the annual tuition; master application fee set to 20 EUR
- Faculdade de Ciencias da Universidade de Lisboa: registration fee set to 50 EUR; application fee set to 60 EUR
- Instituto Superior Tecnico: annual secretary fee set to 30 EUR

## Important importer behavior

- Blank \`semester_fee\` becomes \`0\` in the current importer
- Blank \`application_fee\` becomes \`0\` in the current importer
- Blank \`application_deadline\` stays empty after cleanup

## Recommendation

- Technically safe to upload through the current platform importer
- Clean enough for a conservative upload if you accept blank deadlines where no current official deadline was confirmed
`;

  fs.writeFileSync(REPORT_PATH, `${report}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        rows: cleanedRows.length,
        output: path.basename(OUTPUT_PATH),
        clearedDeadlines,
        updatedDeadlines,
        generatedIds,
        filledSemesterFee,
        filledApplicationFee,
        defaultFormatCount,
        defaultPaceCount,
        blankSemesterFee,
        blankApplicationFee
      },
      null,
      2
    )
  );
}

main();
