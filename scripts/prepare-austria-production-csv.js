/**
 * Prepare a platform-ready Austria CSV from the richer extended export.
 *
 * What it does:
 * 1. Loads the extended Austria CSV with links and descriptions
 * 2. Fixes known tuition parsing issues (currently the FH Technikum Wien 3.00 bug)
 * 3. Optionally fetches official pages to enrich application deadlines
 * 4. Writes a cleaned production CSV for import/upload
 *
 * Usage:
 *   node scripts/prepare-austria-production-csv.js
 *   node scripts/prepare-austria-production-csv.js --fetch-deadlines
 *   node scripts/prepare-austria-production-csv.js --in my.csv --out cleaned.csv --fetch-deadlines
 */

import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fetchDeadlines = process.argv.includes('--fetch-deadlines');
const inIndex = process.argv.indexOf('--in');
const outIndex = process.argv.indexOf('--out');

const defaultInput = resolve(
  __dirname,
  '..',
  'austria_programmes_under_10000_eur_english_only_admin_import_extended.csv'
);
const defaultOutput = resolve(__dirname, '..', 'austria_programmes_production_platform.csv');
const defaultQualityOutput = resolve(
  __dirname,
  '..',
  'austria_programmes_production_platform_quality_ready.csv'
);
const defaultFullReadyOutput = resolve(
  __dirname,
  '..',
  'austria_programmes_production_platform_full_ready.csv'
);

const inputPath = inIndex >= 0 ? resolve(process.cwd(), process.argv[inIndex + 1]) : defaultInput;
const outputPath = outIndex >= 0 ? resolve(process.cwd(), process.argv[outIndex + 1]) : defaultOutput;
const qualityOutputPath =
  outIndex >= 0
    ? outputPath.replace(/\.csv$/i, '_quality_ready.csv')
    : defaultQualityOutput;
const fullReadyOutputPath =
  outIndex >= 0
    ? outputPath.replace(/\.csv$/i, '_full_ready.csv')
    : defaultFullReadyOutput;

const UNIVERSITY_FALLBACK_DEADLINES = new Map([
  [
    'Universität Linz',
    'EU: July 8, 2026 to October 31, 2026; non-EU: February 6, 2026 to March 31, 2026'
  ],
  [
    'Universität Innsbruck',
    'EU: July 13, 2026 to October 31, 2026; non-EU: April 1, 2026 to May 15, 2026'
  ],
  [
    'Universität Salzburg',
    'non-EU: August 10, 2026'
  ],
  [
    'Universität für Bodenkultur Wien',
    'EU: June 16, 2026 to October 31, 2026; non-EU: March 1, 2026 to July 31, 2026'
  ],
  [
    'Technische Universität Wien',
    'EU: July 6, 2026 to October 31, 2026; non-EU: January 16, 2026 to July 15, 2026'
  ],
  [
    'Universität Klagenfurt',
    'EU: July 6, 2026 to October 31, 2026; non-EU: June 30, 2026'
  ],
  [
    'Montanuniversität Leoben',
    'EU: June 12, 2026 to September 5, 2026; non-EU: February 23, 2026 to April 30, 2026'
  ]
]);

if (!existsSync(inputPath)) {
  console.error(`Input CSV not found: ${inputPath}`);
  process.exit(1);
}

const responseCache = new Map();

const OUTPUT_HEADERS = [
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
  'quality_tier',
  'quality_ready',
  'quality_issues'
];

const CORE_REQUIRED_FIELDS = [
  'program_name',
  'university_name',
  'country',
  'city',
  'tuition_per_semester',
  'degree_level',
  'field_of_study',
  'language_of_instruction',
  'living_cost_per_month',
  'official_url',
  'direct_application_url',
  'source_url',
  'full_description_text',
  'program_duration_months',
  'duration'
];

const STRONG_REQUIRED_FIELDS = [...CORE_REQUIRED_FIELDS, 'semester_fee', 'application_deadline'];

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function decodeEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&uuml;/gi, 'u')
    .replace(/&ouml;/gi, 'o')
    .replace(/&auml;/gi, 'a')
    .replace(/&szlig;/gi, 'ss');
}

function stripHtml(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function stripTags(text) {
  return decodeEntities(String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function formatDeadline(euDeadline, nonEuDeadline) {
  if (euDeadline && nonEuDeadline) return `EU: ${euDeadline}; non-EU: ${nonEuDeadline}`;
  if (nonEuDeadline) return `non-EU: ${nonEuDeadline}`;
  if (euDeadline) return `EU: ${euDeadline}`;
  return '';
}

function normalizeDateLabel(label) {
  return String(label || '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
}

function normalizeOrdinalDate(text) {
  return String(text || '').replace(/(\d{1,2})(st|nd|rd|th)/gi, '$1');
}

const MONTH_PATTERN = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';

function extractYear(value) {
  const match = String(value || '').match(/\b(20\d{2}|\d{2})\b(?!.*\b(20\d{2}|\d{2})\b)/);
  if (!match) return '';
  return match[1].length === 2 ? `20${match[1]}` : match[1];
}

function hasYear(value) {
  return /\b(?:20\d{2}|\d{2})\b/.test(String(value || ''));
}

function normalizeDottedDate(text) {
  return String(text || '')
    .replace(/\b(\d{1,2})\.(\d{1,2})\s+(20\d{2})\b/g, '$1.$2.$3')
    .replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{2})\b/g, '$1.$2.20$3');
}

function dedupeDateCandidates(dates) {
  const unique = [];

  for (const rawDate of dates) {
    const candidate = normalizeDottedDate(normalizeDateLabel(rawDate));
    if (!candidate) continue;

    const lowerCandidate = candidate.toLowerCase();
    const longerExistingIndex = unique.findIndex(
      (existing) =>
        existing.toLowerCase() !== lowerCandidate && existing.toLowerCase().startsWith(lowerCandidate)
    );
    if (longerExistingIndex >= 0) {
      continue;
    }

    const shorterExistingIndex = unique.findIndex(
      (existing) =>
        existing.toLowerCase() !== lowerCandidate && lowerCandidate.startsWith(existing.toLowerCase())
    );
    if (shorterExistingIndex >= 0) {
      unique[shorterExistingIndex] = candidate;
      continue;
    }

    if (!unique.some((existing) => existing.toLowerCase() === lowerCandidate)) {
      unique.push(candidate);
    }
  }

  return unique;
}

function normalizeSingleDeadlinePart(part, fallbackYear = '') {
  let cleaned = normalizeDottedDate(normalizeDateLabel(part));
  if (!cleaned) return '';

  if (fallbackYear && !hasYear(cleaned)) {
    if (/^\d{1,2}\s+[A-Za-z]+$/.test(cleaned)) {
      cleaned = `${cleaned} ${fallbackYear}`;
    } else if (/^\d{1,2}\.\d{1,2}\.?$/.test(cleaned)) {
      cleaned = `${cleaned.replace(/\.$/, '')}.${fallbackYear}`;
    }
  }

  return cleaned;
}

function collapseDateRange(start, end, fallbackYear = '') {
  const normalizedStart = normalizeSingleDeadlinePart(start, fallbackYear);
  const inferredYear = extractYear(normalizedStart) || fallbackYear || extractYear(end);
  const normalizedEnd = normalizeSingleDeadlinePart(end, inferredYear);
  if (!normalizedStart) return normalizedEnd;
  if (!normalizedEnd) return normalizedStart;

  const startLower = normalizedStart.toLowerCase();
  const endLower = normalizedEnd.toLowerCase();
  if (startLower === endLower) return normalizedStart;
  if (startLower.startsWith(endLower)) return normalizedStart;
  if (endLower.startsWith(startLower) && hasYear(normalizedEnd) && !hasYear(normalizedStart)) {
    return normalizedEnd;
  }

  return `${normalizedStart} to ${normalizedEnd}`;
}

function cleanupNormalizedDeadline(deadlineText) {
  const text = normalizeDottedDate(normalizeDateLabel(deadlineText));
  if (!text) return '';

  const dualLabelMatch = text.match(/^EU:\s*([^;]+);\s*non-EU:\s*(.+)$/i);
  if (dualLabelMatch) {
    const euPart = cleanupNormalizedDeadline(dualLabelMatch[1]).replace(/^EU:\s*/i, '');
    const nonEuPart = cleanupNormalizedDeadline(dualLabelMatch[2]).replace(/^non-EU:\s*/i, '');
    const fallbackYear = extractYear(euPart);
    const finalNonEuPart = normalizeSingleDeadlinePart(nonEuPart, fallbackYear);

    if (euPart && finalNonEuPart) return `EU: ${euPart}; non-EU: ${finalNonEuPart}`;
    if (finalNonEuPart) return `non-EU: ${finalNonEuPart}`;
    return euPart ? `EU: ${euPart}` : '';
  }

  const labeledMatch = text.match(/^(EU|non-EU):\s*(.+)$/i);
  if (labeledMatch) {
    const label = /^eu$/i.test(labeledMatch[1]) ? 'EU' : 'non-EU';
    const body = labeledMatch[2].trim();
    const rangeMatch = body.match(/^(.+?)\s+to\s+(.+)$/i);
    if (rangeMatch) {
      const collapsed = collapseDateRange(rangeMatch[1], rangeMatch[2]);
      return collapsed ? `${label}: ${collapsed}` : '';
    }

    const cleaned = normalizeSingleDeadlinePart(body);
    return cleaned ? `${label}: ${cleaned}` : '';
  }

  const rangeMatch = text.match(/^(.+?)\s+to\s+(.+)$/i);
  if (rangeMatch) {
    return collapseDateRange(rangeMatch[1], rangeMatch[2]);
  }

  return normalizeSingleDeadlinePart(text);
}

function normalizeDeadlineCandidate(deadlineText) {
  const text = normalizeOrdinalDate(String(deadlineText || '').replace(/\s+/g, ' ').trim());
  if (!text) return '';

  const dualLabeled = text.match(/EU:\s*([^;]+);\s*non-EU:\s*(.+)$/i);
  if (dualLabeled) {
    const euPart = normalizeDeadlineCandidate(dualLabeled[1]).replace(/^non-EU:\s*/i, '');
    const nonEuPart = normalizeDeadlineCandidate(dualLabeled[2]).replace(/^non-EU:\s*/i, '');
    if (euPart && nonEuPart) return `EU: ${euPart}; non-EU: ${nonEuPart}`;
    if (nonEuPart) return `non-EU: ${nonEuPart}`;
    return euPart ? `EU: ${euPart}` : '';
  }

  const labelledDualPatterns = [
    /eu(?:\/eea)?(?:[^0-9A-Za-z]{0,10}| applicants| countries)?\s*[:,-]?\s*(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)(?:[^A-Za-z0-9]{1,12}| until | to | - )(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/i,
    /non-eu(?:\/eea)?(?:[^0-9A-Za-z]{0,10}| applicants| countries| citizens)?\s*[:,-]?\s*(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)(?:[^A-Za-z0-9]{1,12}| until | to | - )(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/i
  ];

  const explicitRangePatterns = [
    /(\d{1,2}\.\d{1,2}\.?)\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/,
    /(\d{1,2}\.\d{1,2}\.\d{2,4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/,
    new RegExp(`(\\d{1,2}\\s+${MONTH_PATTERN}(?:\\s+\\d{4})?)\\s*(?:to|until|[-–])\\s*(\\d{1,2}\\s+${MONTH_PATTERN}(?:\\s+\\d{4})?)`, 'i'),
    new RegExp(`(${MONTH_PATTERN}\\s+\\d{1,2},\\s+\\d{4})\\s*(?:to|until|[-–])\\s*(${MONTH_PATTERN}\\s+\\d{1,2},\\s+\\d{4})`, 'i')
  ];

  for (const pattern of explicitRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      let start = normalizeDateLabel(match[1]);
      let end = normalizeDateLabel(match[2]);
      const endYear = end.match(/(\d{4}|\d{2})$/)?.[1];
      if (endYear && !/\d{2,4}$/.test(start)) start = `${start} ${endYear}`;
      return `${start} to ${end}`;
    }
  }

  const labeledSinglePatterns = [
    new RegExp(
      `([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})[^.]{0,120}?for applicants from non-eu[^.]{0,160}?([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})[^.]{0,120}?for applicants from eu`,
      'i'
    ),
    new RegExp(
      `([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})[^.]{0,120}?for applicants from eu[^.]{0,160}?([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})[^.]{0,120}?for applicants from non-eu`,
      'i'
    ),
    new RegExp(
      `non-eu(?:\\/eea)?(?:[^0-9A-Za-z]{0,10}| applicants| countries| citizens)?\\s*[:,-]?\\s*([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})`,
      'i'
    ),
    new RegExp(
      `eu(?:\\/eea)?(?:[^0-9A-Za-z]{0,10}| applicants| countries| citizens)?\\s*[:,-]?\\s*([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}|\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})`,
      'i'
    )
  ];

  for (const pattern of labeledSinglePatterns) {
    const match = text.match(pattern);
    if (!match) continue;

    if (match.length >= 3 && /for applicants from non-eu/i.test(match[0]) && /for applicants from eu/i.test(match[0])) {
      if (/for applicants from non-eu/i.test(match[0]) && /for applicants from eu/i.test(match[0])) {
        const firstNonEu = /for applicants from non-eu/i.test(match[0].split(match[1])[1] || '') ? match[1] : match[2];
        const firstEu = firstNonEu === match[1] ? match[2] : match[1];
        return cleanupNormalizedDeadline(formatDeadline(firstEu, firstNonEu));
      }
    }

    if (/^non-eu/i.test(match[0])) {
      return cleanupNormalizedDeadline(`non-EU: ${match[1]}`);
    }

    if (/^eu/i.test(match[0])) {
      return cleanupNormalizedDeadline(`EU: ${match[1]}`);
    }
  }

  const explicitDatePatterns = [
    new RegExp(`(${MONTH_PATTERN}\\s+\\d{1,2},\\s+\\d{4})`, 'i'),
    /(\d{1,2}\.\d{1,2}\.\d{2,4})/,
    new RegExp(`(\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4})`, 'i'),
    new RegExp(`(\\d{1,2}\\s+${MONTH_PATTERN})`, 'i')
  ];

  const nonEuHint = /non-eu|third countries|international students|outside the eu/i.test(text);
  const euHint = /eu\/eea|within the eu|eu countries/i.test(text);

  const foundDates = [];
  for (const pattern of explicitDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      foundDates.push(normalizeDateLabel(match[1]));
    }
  }

  const uniqueDates = dedupeDateCandidates(foundDates);

  if (uniqueDates.length >= 2 && (nonEuHint || euHint)) {
    if (euHint && nonEuHint) return cleanupNormalizedDeadline(`EU: ${uniqueDates[0]}; non-EU: ${uniqueDates[1]}`);
    if (nonEuHint) return cleanupNormalizedDeadline(`non-EU: ${uniqueDates[0]}`);
    if (euHint) return cleanupNormalizedDeadline(`EU: ${uniqueDates[0]}`);
  }

  if (uniqueDates.length) {
    return cleanupNormalizedDeadline(`${nonEuHint ? 'non-EU: ' : ''}${uniqueDates[0]}`);
  }

  return '';
}

function parseDeadlineDates(deadlineText) {
  const text = String(deadlineText || '');
  const parsedDates = [];

  const longMatches = text.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/g) || [];
  for (const match of longMatches) {
    const parsed = new Date(match);
    if (!Number.isNaN(parsed.getTime())) parsedDates.push(parsed);
  }

  const dayFirstLongMatches = text.match(new RegExp(`\\d{1,2}\\s+${MONTH_PATTERN}\\s+\\d{4}`, 'g')) || [];
  for (const match of dayFirstLongMatches) {
    const parsed = new Date(match);
    if (!Number.isNaN(parsed.getTime())) parsedDates.push(parsed);
  }

  const shortMatches = text.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/g) || [];
  for (const match of shortMatches) {
    const [day, month, rawYear] = match.split('.').map((value) => Number.parseInt(value, 10));
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) parsedDates.push(parsed);
  }

  return parsedDates;
}

function isStaleDeadline(deadlineText) {
  const dates = parseDeadlineDates(deadlineText);
  if (!dates.length) return false;

  const today = new Date();
  const comparisonDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dates.every((date) => date < comparisonDate);
}

function extractDeadlineFromText(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  const dualPatterns = [
    /application deadline for applicants within the eu is ([A-Za-z]+ \d{1,2}, \d{4}), and for applicants outside the eu, ([A-Za-z]+ \d{1,2}, \d{4})/i,
    /within the eu(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})(?:[^.]{0,160}?)outside the eu(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /eu(?:\/eea)? applicants(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})(?:[^.]{0,160}?)non-eu(?:\/eea)? applicants(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /eu(?:\/eea)? countries\)?(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})(?:[^.]{0,200}?)third countries\)?(?:[^.]{0,120}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /for applicants within the eu(?:[^.]{0,80}?)?([A-Za-z]+ \d{1,2}, \d{4})(?:[^.]{0,160}?)for applicants outside the eu(?:[^.]{0,80}?)?([A-Za-z]+ \d{1,2}, \d{4})/i
  ];

  for (const pattern of dualPatterns) {
    const match = normalized.match(pattern);
    if (match) return formatDeadline(match[1], match[2]);
  }

  const singlePatterns = [
    /application deadline(?:[^.]{0,80}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /applications? close(?:[^.]{0,80}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /deadline(?:[^.]{0,50}?)?([A-Za-z]+ \d{1,2}, \d{4})/i,
    /bewerbungsfrist(?:[^.]{0,80}?)?(\d{1,2}\.\d{1,2}\.\d{4})/i,
    /registration for the academic year \d{4}\/\d{2}:\s*(\d{1,2}\s+[A-Za-z]+)\s+to\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /admission period(?:[^.]{0,80}?)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /application period(?:[^.]{0,80}?)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i
  ];

  for (const pattern of singlePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      if (match[2]) {
        const start = normalizeDateLabel(match[1]);
        const end = normalizeDateLabel(match[2]);
        const yearMatch = end.match(/(\d{4})$/);
        const completedStart = yearMatch && !/\d{4}$/.test(start) ? `${start} ${yearMatch[1]}` : start;
        return formatDeadline('', `${completedStart} to ${end}`);
      }
      return formatDeadline('', normalizeDateLabel(match[1]));
    }
  }

  const listPattern = /(?:deadline|application period|admission period|bewerbungsfrist)(?:[^.:]{0,80})[: ]+([A-Za-z0-9, ./-]{5,80})/i;
  const listMatch = normalized.match(listPattern);
  if (listMatch) {
    return formatDeadline('', normalizeDateLabel(listMatch[1]));
  }

  return '';
}

function extractCandidateLinks(html, baseUrl) {
  const candidates = [];
  const pattern = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const rawHref = String(match[1] || '').trim();
    const text = stripTags(match[2] || '');
    if (!rawHref || !text) continue;

    let absoluteUrl;
    try {
      absoluteUrl = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    const marker = `${text} ${absoluteUrl}`.toLowerCase();
    const score =
      (/(deadline|deadlines|admission period|application period|admission and deadlines)/i.test(text) ? 6 : 0) +
      (/(international students|third countries|register to enroll|enrol|admission procedure)/i.test(text) ? 4 : 0) +
      (/(deadline|admission|apply|application|register|enrol|enroll)/i.test(absoluteUrl) ? 2 : 0);

    if (score > 0) {
      candidates.push({ url: absoluteUrl, score, marker });
    }
  }

  const seen = new Set();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      if (seen.has(candidate.url)) return false;
      seen.add(candidate.url);
      return true;
    })
    .slice(0, 6);
}

async function fetchText(url) {
  if (!url) return { ok: false, text: '', html: '', finalUrl: url };
  if (responseCache.has(url)) return responseCache.get(url);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; AbroaducateBot/1.0; +https://abroaducate.com)'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      const failed = { ok: false, text: '', html: '', finalUrl: url };
      responseCache.set(url, failed);
      return failed;
    }

    const html = await response.text();
    const result = {
      ok: true,
      html,
      text: stripHtml(html),
      finalUrl: response.url || url
    };
    responseCache.set(url, result);
    return result;
  } catch {
    const failed = { ok: false, text: '', html: '', finalUrl: url };
    responseCache.set(url, failed);
    return failed;
  }
}

async function fetchDeadline(url) {
  if (!url) return '';

  const primary = await fetchText(url);
  if (!primary.ok) return '';

  const extracted = cleanupNormalizedDeadline(normalizeDeadlineCandidate(extractDeadlineFromText(primary.text)));
  if (extracted && !isStaleDeadline(extracted)) return extracted;

  const candidates = extractCandidateLinks(primary.html, primary.finalUrl);
  for (const candidate of candidates) {
    const secondary = await fetchText(candidate.url);
    if (!secondary.ok) continue;
    const fallback = cleanupNormalizedDeadline(
      normalizeDeadlineCandidate(extractDeadlineFromText(secondary.text))
    );
    if (fallback && !isStaleDeadline(fallback)) return fallback;
  }

  return '';
}

function correctRow(row) {
  const corrected = { ...row };
  const tuition = toNumber(corrected.tuition_per_semester);
  const officialUrl = String(corrected.official_url || '').trim();
  const isTechnikum = /technikum-wien\.at/i.test(officialUrl);

  if (isTechnikum && tuition > 0 && tuition < 10) {
    corrected.tuition_per_semester = '363.36';
    if (!String(corrected.semester_fee || '').trim()) {
      corrected.semester_fee = '25.20';
    }
  }

  return corrected;
}

function buildProgramId(row, rowIndex) {
  if (String(row.id || '').trim()) return slugify(row.id);

  const sourceKey = slugify(String(row.source_url || row.official_url || row.direct_application_url || rowIndex));
  const base = slugify([
    'austria',
    row.university_name,
    row.program_name,
    row.city,
    row.degree_level
  ].filter(Boolean).join('-'));

  return `${base.substring(0, 96)}-${sourceKey.substring(0, 20)}`.replace(/-+$/g, '');
}

function finalizeRow(row, rowIndex) {
  const finalized = { ...row };
  finalized.id = buildProgramId(finalized, rowIndex);
  finalized.intake = String(finalized.intake || '').trim() || 'Check official site';
  finalized.application_deadline = cleanupNormalizedDeadline(
    normalizeDeadlineCandidate(String(finalized.application_deadline || '').trim())
  );

  const coreIssues = CORE_REQUIRED_FIELDS.filter(
    (field) => String(finalized[field] ?? '').trim() === ''
  );
  const strongIssues = STRONG_REQUIRED_FIELDS.filter(
    (field) => String(finalized[field] ?? '').trim() === ''
  );

  finalized.quality_tier =
    strongIssues.length === 0 ? 'full' : coreIssues.length === 0 ? 'core' : 'incomplete';
  finalized.quality_ready = coreIssues.length === 0 ? 'true' : 'false';
  finalized.quality_issues = strongIssues.join('; ');
  return finalized;
}

function getFallbackDeadlineForRow(row) {
  return cleanupNormalizedDeadline(
    UNIVERSITY_FALLBACK_DEADLINES.get(String(row.university_name || '').trim()) || ''
  );
}

async function main() {
  const raw = readFileSync(inputPath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });

  const correctedRows = rows.map(correctRow);
  let deadlineHits = 0;

  if (fetchDeadlines) {
    for (let i = 0; i < correctedRows.length; i++) {
      const row = correctedRows[i];
      if (String(row.application_deadline || '').trim()) continue;

      const urlCandidates = [
        String(row.official_url || '').trim(),
        String(row.direct_application_url || '').trim(),
        String(row.source_url || '').trim()
      ].filter(Boolean);

      let deadline = '';
      for (const url of [...new Set(urlCandidates)]) {
        deadline = await fetchDeadline(url);
        if (deadline) break;
      }

      if (deadline) {
        row.application_deadline = deadline;
        deadlineHits++;
      } else {
        const fallbackDeadline = getFallbackDeadlineForRow(row);
        if (fallbackDeadline) {
          row.application_deadline = fallbackDeadline;
          deadlineHits++;
        }
      }

      if ((i + 1) % 25 === 0 || i === correctedRows.length - 1) {
        console.log(`Checked deadlines: ${i + 1}/${correctedRows.length} | found ${deadlineHits}`);
      }
    }
  }

  const finalizedRows = correctedRows.map((row, index) => finalizeRow(row, index + 2));
  const qualityRows = finalizedRows.filter((row) => row.quality_ready === 'true');
  const fullReadyRows = finalizedRows.filter((row) => row.quality_tier === 'full');
  const csv = [
    OUTPUT_HEADERS.join(','),
    ...finalizedRows.map((row) => OUTPUT_HEADERS.map((header) => escapeCsv(row[header])).join(','))
  ].join('\n');
  const qualityCsv = [
    OUTPUT_HEADERS.join(','),
    ...qualityRows.map((row) => OUTPUT_HEADERS.map((header) => escapeCsv(row[header])).join(','))
  ].join('\n');
  const fullReadyCsv = [
    OUTPUT_HEADERS.join(','),
    ...fullReadyRows.map((row) => OUTPUT_HEADERS.map((header) => escapeCsv(row[header])).join(','))
  ].join('\n');

  writeFileSync(outputPath, csv, 'utf8');
  writeFileSync(qualityOutputPath, qualityCsv, 'utf8');
  writeFileSync(fullReadyOutputPath, fullReadyCsv, 'utf8');

  const stillBlankDeadlines = finalizedRows.filter((row) => !String(row.application_deadline || '').trim()).length;
  const ultraLow = finalizedRows.filter((row) => {
    const tuition = toNumber(row.tuition_per_semester);
    return tuition > 0 && tuition <= 10;
  }).length;

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Quality Output: ${qualityOutputPath}`);
  console.log(`Full-Ready Output: ${fullReadyOutputPath}`);
  console.log(`Rows: ${finalizedRows.length}`);
  console.log(`Quality-ready rows: ${qualityRows.length}`);
  console.log(`Full-ready rows: ${fullReadyRows.length}`);
  console.log(`Deadlines filled this run: ${deadlineHits}`);
  console.log(`Rows still missing deadlines: ${stillBlankDeadlines}`);
  console.log(`Rows with tuition <= 10 after cleanup: ${ultraLow}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
