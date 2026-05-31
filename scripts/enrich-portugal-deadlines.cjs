const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, 'portugal_strict_upload_ready_conservative_cleaned.csv');
const OUTPUT_PATH = INPUT_PATH;
const REPORT_PATH = path.join(ROOT, 'scratch', 'portugal_deadline_enrichment_2026-05-24.csv');

const FCUL_BACHELOR_CLOSE = '2026-05-22';
const FCUL_BACHELOR_SOURCE = 'https://ciencias.ulisboa.pt/en/node/9310';
const IST_INTL_CLOSE = '2026-05-22';
const IST_INTL_SOURCE = 'https://tecnico.ulisboa.pt/en/education/study-at-tecnico/applications/international-students/';
const UA_BACHELOR_INTL_CLOSE = '2026-07-09';
const UA_BACHELOR_INTL_SOURCE = 'https://www.ua.pt/pt/acesso-ingresso-internacionais';

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

function toIsoDate(ddmmyyyy) {
  const match = String(ddmmyyyy || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function findLatestDateInText(text) {
  const matches = [...String(text || '').matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)]
    .map((match) => toIsoDate(match[1]))
    .filter(Boolean)
    .sort();

  return matches.length ? matches[matches.length - 1] : null;
}

function extractUaDeadlineSection(text) {
  const body = String(text || '');
  const start = body.indexOf('Candidaturas');
  if (start < 0) return '';

  const tail = body.slice(start);
  const endCandidates = ['Plano Curricular', 'Registos', 'Resultados Acreditação', 'Mais informação'];
  let end = tail.length;

  for (const marker of endCandidates) {
    const idx = tail.indexOf(marker);
    if (idx >= 0 && idx < end) end = idx;
  }

  return tail.slice(0, end);
}

async function scrapeUaDeadlines(rows) {
  const uaRows = rows.filter(
    (row) =>
      !String(row.application_deadline || '').trim() &&
      /ua\.pt\/pt\/curso\//i.test(String(row.official_url || ''))
  );

  const uniqueUrls = [...new Set(uaRows.map((row) => row.official_url.trim()))];
  if (!uniqueUrls.length) return new Map();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1800 },
    locale: 'pt-PT'
  });
  const page = await context.newPage();
  const results = new Map();

  try {
    for (const url of uniqueUrls) {
      let status = 'ok';
      let deadline = '';
      let evidence = '';

      for (let attempt = 1; attempt <= 2 && !deadline; attempt += 1) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
          await page.waitForTimeout(attempt === 1 ? 5000 : 8000);
          const text = await page.locator('body').innerText();
          const section = extractUaDeadlineSection(text);
          deadline = findLatestDateInText(section) || '';
          evidence = section.replace(/\s+/g, ' ').trim().slice(0, 500);

          if (!deadline) {
            status = section.includes('Curso sem fase de candidaturas ativas')
              ? 'no-active-applications'
              : 'no-date-found';
          }
        } catch (error) {
          status = `error: ${error.message}`;
        }
      }

      results.set(url, { deadline, status, evidence });
      console.log(`[UA] ${url} -> ${deadline || status}`);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return results;
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing input CSV: ${INPUT_PATH}`);
  }

  const csv = fs.readFileSync(INPUT_PATH, 'utf8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true });
  const headers = Object.keys(rows[0] || {});
  const review = [];

  const uaResults = await scrapeUaDeadlines(rows);

  let updated = 0;
  let remainingBlank = 0;

  for (const row of rows) {
    const originalDeadline = String(row.application_deadline || '').trim();
    if (originalDeadline) continue;

    let nextDeadline = '';
    let source = '';
    let evidence = '';
    let strategy = '';

    if (/ua\.pt\/pt\/curso\//i.test(String(row.official_url || ''))) {
      const result = uaResults.get(String(row.official_url || '').trim());
      if (result?.deadline) {
        nextDeadline = result.deadline;
        source = row.official_url;
        evidence = result.evidence;
        strategy = 'UA course page candidature window';
      } else if (String(row.degree_level || '').toLowerCase() === 'bachelor') {
        nextDeadline = UA_BACHELOR_INTL_CLOSE;
        source = UA_BACHELOR_INTL_SOURCE;
        evidence = '3ª fase 1 a 9 de julho de 2026';
        strategy = 'UA international bachelor application page';
      } else {
        strategy = `UA scrape fallback: ${result?.status || 'missing-result'}`;
      }
    } else if (
      /Faculdade de Ci/i.test(String(row.university_name || '')) &&
      String(row.degree_level || '').toLowerCase() === 'bachelor'
    ) {
      nextDeadline = FCUL_BACHELOR_CLOSE;
      source = FCUL_BACHELOR_SOURCE;
      evidence = "Application: from 6 April to 22 May 2026";
      strategy = 'FCUL bachelor international application page';
    } else if (/Instituto Superior T/i.test(String(row.university_name || ''))) {
      nextDeadline = IST_INTL_CLOSE;
      source = IST_INTL_SOURCE;
      evidence = 'Submission of applications April 6th to May 22nd (5pm WET) 2026';
      strategy = 'IST international students application page';
    }

    if (nextDeadline) {
      row.application_deadline = nextDeadline;
      updated += 1;
    } else {
      remainingBlank += 1;
    }

    review.push({
      id: row.id,
      program_name: row.program_name,
      university_name: row.university_name,
      official_url: row.official_url,
      original_deadline: originalDeadline,
      updated_deadline: nextDeadline,
      strategy,
      source,
      evidence
    });
  }

  writeCsv(OUTPUT_PATH, headers, rows);
  writeCsv(
    REPORT_PATH,
    [
      'id',
      'program_name',
      'university_name',
      'official_url',
      'original_deadline',
      'updated_deadline',
      'strategy',
      'source',
      'evidence'
    ],
    review
  );

  const finalBlank = rows.filter((row) => !String(row.application_deadline || '').trim()).length;

  console.log(`Updated deadlines: ${updated}`);
  console.log(`Still blank after enrichment: ${finalBlank}`);
  console.log(`Review file: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
