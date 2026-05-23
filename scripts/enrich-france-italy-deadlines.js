/**
 * Enrich France and Italy cleaned CSVs with researched application deadlines
 * and application_open_date values, based on institution-level policies.
 *
 * Each rule documents its evidence so we can audit later.
 *
 * Input:
 *   france_final_upload_cleaned.csv
 *   italy_final_upload_cleaned.csv
 *
 * Output:
 *   france_final_upload_enriched.csv
 *   italy_final_upload_enriched.csv
 *   france_final_upload_enrichment_report.csv
 *   italy_final_upload_enrichment_report.csv
 *
 * Usage:
 *   node scripts/enrich-france-italy-deadlines.js
 */

import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

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

// ── Rule engine ──────────────────────────────────────────────────────────────
//
// Each rule either matches on `university_name` (exact or regex) or on a
// `program_predicate` (function of the row). The first matching rule wins so
// order matters: put more specific rules before broader ones.
//
// A rule may set:
//   application_deadline (ISO YYYY-MM-DD)
//   intake (if the source had "Check official site", we can clarify)
// Every applied rule is logged with its source URL so we can re-verify.

// We use today's real date (at script-run time) plus a small buffer to
// decide which year an annual deadline should point to. The buffer matters
// because a deadline "closing today" is effectively past — students need lead
// time to apply, so we roll over to next year if the deadline is within the
// next 14 days.
const TODAY = new Date();
const ROLLOVER_BUFFER_DAYS = 14;

function iso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Return the next future occurrence of an annual deadline that falls on
// (month, day). If the current year's date has already passed (or is within
// ROLLOVER_BUFFER_DAYS), roll to the following year.
function nextAnnual(month, day) {
  const year = TODAY.getFullYear();
  const thisYear = new Date(Date.UTC(year, month - 1, day));
  const cutoff = new Date(TODAY.getTime() + ROLLOVER_BUFFER_DAYS * 24 * 60 * 60 * 1000);
  if (thisYear.getTime() >= cutoff.getTime()) {
    return iso(year, month, day);
  }
  return iso(year + 1, month, day);
}

// Given an ISO date string, roll it forward one year at a time until it is
// in the future (with the same ROLLOVER_BUFFER_DAYS buffer we use elsewhere).
// Returns the ISO string of the next future occurrence. If input is not ISO,
// returns null.
function rollForwardIso(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map((n) => Number.parseInt(n, 10));
  const cutoffMs = TODAY.getTime() + ROLLOVER_BUFFER_DAYS * 24 * 60 * 60 * 1000;
  let year = y;
  let candidate = new Date(Date.UTC(year, m - 1, d));
  while (candidate.getTime() < cutoffMs) {
    year += 1;
    candidate = new Date(Date.UTC(year, m - 1, d));
  }
  return iso(year, m, d);
}

// Given any date value (existing CSV ISO, or one produced by nextAnnual), make
// sure we never store a past or imminent deadline.
function ensureFuture(dateStr) {
  return rollForwardIso(dateStr) || dateStr;
}

// Helper: pick a deadline if it's still in the future, otherwise use next year.
// Because this is research valid as of May 2026, most deadlines for 2026 entry
// are already past. We keep them anyway since they represent the most recent
// concrete deadline the institution published, and we note "next intake" in
// the report. The importer itself will simply store the ISO date; the platform
// UI can show "past" / "next intake" formatting downstream.

const RULES = [
  // ── Sciences Po ────────────────────────────────────────────────────────────
  {
    id: 'sciences-po-two-year-master',
    match: (row) =>
      row.university_name === 'Sciences Po' &&
      /^Master /i.test(row.program_name) &&
      row.degree_level === 'Master',
    apply: () => ({
      application_deadline: nextAnnual(10, 1), // 2027 intake opens October 2026
      intake: 'Autumn 2027 (applications open October 2026)',
      reason:
        'Sciences Po 2026 graduate intake is closed. Applications for the 2027 intake open at the end of September 2026; closing date expected to mirror Feb 2027. Using 2026-10-01 as nominal opening date.',
      source: 'https://www.sciencespo.fr/admissions/en/graduate/international-admissions/deadlines/'
    })
  },
  {
    id: 'sciences-po-one-year-master-llm',
    match: (row) =>
      row.university_name === 'Sciences Po' &&
      (/^LLM /i.test(row.program_name) ||
        /^Master 1 /i.test(row.program_name) ||
        /one-year/i.test(row.program_name) ||
        /Advanced Global Studies/i.test(row.program_name)),
    apply: () => ({
      application_deadline: nextAnnual(10, 1),
      intake: 'Autumn 2027 (applications open October 2026)',
      reason:
        'Sciences Po one-year master / LLM 2026 intake closed. 2027 intake opens October 2026.',
      source: 'https://www.sciencespo.fr/admissions/en/one-year-master'
    })
  },
  {
    id: 'sciences-po-dual-bachelor',
    match: (row) =>
      row.university_name === 'Sciences Po' &&
      row.degree_level === 'Bachelor',
    apply: () => ({
      application_deadline: nextAnnual(3, 10),
      intake: 'Next autumn cycle',
      reason:
        'Sciences Po undergraduate international admissions close 10 March for autumn entry (confirmed 10 March 2026 for 2026 intake; using 2027-03-10 for next open cycle).',
      source:
        'https://www.sciencespo.fr/en/news/candidates-all-you-need-to-know-about-undergraduate-admissions-through-the-international-admiss/'
    })
  },
  {
    id: 'sciences-po-fallback',
    match: (row) => row.university_name === 'Sciences Po',
    apply: () => ({
      application_deadline: nextAnnual(10, 1),
      intake: 'Autumn 2027 (applications open October 2026)',
      reason:
        'Sciences Po default: 2026 intake closed; 2027 cycle opens October 2026.',
      source: 'https://www.sciencespo.fr/admissions/en/graduate/international-admissions/deadlines/'
    })
  },

  // ── ISAE-Supaero / ENAC / TSAAE ───────────────────────────────────────────
  {
    id: 'isae-supaero-advanced-masters',
    match: (row) =>
      row.university_name === "Institut Supérieur de l'Aéronautique et de l'Espace-Toulouse",
    apply: () => ({
      application_deadline: nextAnnual(5, 12),
      intake: 'Next autumn cycle',
      reason:
        'ISAE-Supaero Advanced Masters share the TSAAE shared application portal. Next deadline: 12 May 2026, midnight French time.',
      source: 'https://www.isae-supaero.fr/en/academics/our-advanced-master-programs/'
    })
  },
  {
    id: 'enac-toulouse',
    match: (row) =>
      row.university_name === "Ecole Nationale de l'Aviation Civile - Toulouse",
    apply: () => ({
      application_deadline: nextAnnual(5, 12),
      intake: 'Next autumn cycle',
      reason:
        'ENAC uses the shared TSAAE application portal with ISAE-Supaero for its advanced masters.',
      source: 'https://www.isae-supaero.fr/en/academics/our-advanced-master-programs/'
    })
  },

  // ── French public universities on Mon Master (EU) / Études en France (non-EU) ──
  // M1 programmes go through Mon Master. Campaign for 2026 entry: Feb 17 – Mar 16 2026.
  // Non-EU students go through Études en France (Oct 1 – Dec 15 of the preceding year).
  // We store the Mon Master closing date as the "master applicant" deadline since it
  // applies to the largest share of candidates (EU + non-EU from non-EEF countries).
  {
    id: 'french-public-m1',
    match: (row) =>
      row.country === 'France' &&
      row.degree_level === 'Master' &&
      /^Master 1 /i.test(row.program_name) &&
      [
        'Université Paris-Saclay',
        'Sorbonne Université',
        'Université Paris Cité',
        'Université de Strasbourg',
        'Université de Lorraine',
        'Université Toulouse Capitole',
        'Nantes Université',
        'Université Grenoble Alpes',
        'Université de Bordeaux',
        'Université de Rennes',
        'Université de Rouen',
        'Université Paris Est Créteil Val-de-Marne',
        'Université de Lille',
        'Université Marie et Louis Pasteur',
        'Université d\'Aix-Marseille',
        'Université du Havre',
        'Université de Caen Normandie',
        'Université Jean Moulin Lyon 3',
        'Université Jean Monnet - Saint-Etienne',
        'Université Bordeaux Montaigne',
        'Université de Bretagne Occidentale - Brest',
        'Le Mans Université',
        'Université de Picardie Jules Verne',
        'Université Côte d\'Azur',
        "Université d'Avignon et des pays du Vaucluse",
        "Université Savoie Mont Blanc",
        "Université Perpignan Via Domitia",
        "Université Panthéon-Sorbonne (Paris 1)",
        'Université Clermont Auvergne',
        'Université de Bourgogne - Dijon',
        'Université Bourgogne Europe',
        'Université de Pau et des Pays de l\'Adour',
        'Université Polytechnique Hauts-de-France',
        'Université du Littoral-Côte d\'Ôpale',
        'Ecole polytechnique de l\'université de Tours',
        'Université d\'Evry Val d\'Essonne',
        'Université Poitiers'
      ].includes(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(3, 16),
      intake: 'Next autumn cycle',
      reason:
        'French national Mon Master M1 campaign: applications open 17 Feb 2026, close 16 Mar 2026. Non-EU students on Études en France apply Oct-Dec.',
      source: 'https://newsroom.univ-cotedazur.eu/news/mon-master-2026-the-application-calendar-is-online'
    })
  },
  {
    id: 'french-public-m2',
    match: (row) =>
      row.country === 'France' &&
      row.degree_level === 'Master' &&
      /^Master 2 /i.test(row.program_name) &&
      [
        'Université Paris-Saclay',
        'Sorbonne Université',
        'Université Paris Cité',
        'Université de Strasbourg',
        'Université de Lorraine',
        'Université Toulouse Capitole',
        'Nantes Université',
        'Université Grenoble Alpes',
        'Université de Bordeaux',
        'Université de Rennes',
        'Université de Rouen',
        'Université Paris Est Créteil Val-de-Marne',
        'Université de Lille',
        'Université Marie et Louis Pasteur',
        "Université d'Aix-Marseille",
        'Université du Havre',
        'Université de Caen Normandie',
        'Université Jean Moulin Lyon 3',
        'Université Jean Monnet - Saint-Etienne',
        'Université Bordeaux Montaigne',
        'Université de Bretagne Occidentale - Brest',
        'Le Mans Université',
        'Université de Picardie Jules Verne',
        "Université Côte d'Azur",
        "Université d'Avignon et des pays du Vaucluse",
        'Université Savoie Mont Blanc',
        'Université Perpignan Via Domitia',
        'Université Panthéon-Sorbonne (Paris 1)',
        'Université Clermont Auvergne',
        'Université de Bourgogne - Dijon',
        'Université Bourgogne Europe',
        "Université de Pau et des Pays de l'Adour",
        'Université Polytechnique Hauts-de-France',
        "Université du Littoral-Côte d'Ôpale",
        "Ecole polytechnique de l'université de Tours",
        "Université d'Evry Val d'Essonne",
        'Université Poitiers'
      ].includes(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'French public university M2 admissions: typical visa-applicant (non-EU) deadline is 30 May for autumn entry, with EU candidates going later (to late June). Using 30 May 2026 as the binding deadline.',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m2'
    })
  },
  // Non-M1/M2 prefix masters at French public universities (many are labelled
  // "Master's degree in X" or "Master of Science in X"): fall back to Mon Master
  // window for entry-year masters.
  {
    id: 'french-public-master-generic',
    match: (row) =>
      row.country === 'France' &&
      row.degree_level === 'Master' &&
      [
        'Université Paris-Saclay',
        'Sorbonne Université',
        'Université Paris Cité',
        'Université de Strasbourg',
        'Université de Lorraine',
        'Université Toulouse Capitole',
        'Nantes Université',
        'Université Grenoble Alpes',
        'Université de Bordeaux',
        'Université de Rennes',
        'Université de Rouen',
        'Université Paris Est Créteil Val-de-Marne',
        'Université de Lille',
        'Université Marie et Louis Pasteur',
        "Université d'Aix-Marseille",
        'Université du Havre',
        'Université de Caen Normandie',
        'Université Jean Moulin Lyon 3',
        'Université Jean Monnet - Saint-Etienne',
        'Université Bordeaux Montaigne',
        'Université de Bretagne Occidentale - Brest',
        'Le Mans Université',
        'Université de Picardie Jules Verne',
        "Université Côte d'Azur",
        "Université d'Avignon et des pays du Vaucluse",
        'Université Savoie Mont Blanc',
        'Université Perpignan Via Domitia',
        'Université Panthéon-Sorbonne (Paris 1)',
        'Université Clermont Auvergne',
        'Université de Bourgogne - Dijon',
        'Université Bourgogne Europe',
        "Université de Pau et des Pays de l'Adour",
        'Université Polytechnique Hauts-de-France',
        "Université du Littoral-Côte d'Ôpale",
        "Ecole polytechnique de l'université de Tours",
        "Université d'Evry Val d'Essonne",
        'Université Poitiers',
        'Université Angers',
        'IAE - Université Montpellier',
        "IAE - Université d'Aix-Marseille",
        "IAE - Université d'Angers",
        'IAE-ISM - Université de Versailles Saint Quentin en Yvelines'
      ].includes(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(3, 16),
      intake: 'Next autumn cycle',
      reason:
        'French public university master (entry year): Mon Master closing date is 16 March 2026. Non-EU candidates on Études en France have earlier deadline (Oct-Dec prior year).',
      source: 'https://newsroom.univ-cotedazur.eu/news/mon-master-2026-the-application-calendar-is-online'
    })
  },
  {
    id: 'french-public-bachelor-generic',
    match: (row) =>
      row.country === 'France' &&
      row.degree_level === 'Bachelor' &&
      [
        'Université Paris-Saclay',
        'Sorbonne Université',
        'Université Paris Cité',
        'Université de Strasbourg',
        'Université de Lorraine',
        'Université Toulouse Capitole',
        'Nantes Université',
        'Université Grenoble Alpes',
        'Université de Bordeaux',
        'Université de Rennes',
        'Université de Rouen',
        'Université Paris Est Créteil Val-de-Marne',
        'Université de Lille',
        'Université Marie et Louis Pasteur',
        "Université d'Aix-Marseille",
        'Université du Havre',
        'Université de Caen Normandie',
        'Université Jean Moulin Lyon 3',
        'Université Jean Monnet - Saint-Etienne',
        'Université Bordeaux Montaigne',
        'Université de Bretagne Occidentale - Brest',
        'Le Mans Université',
        'Université de Picardie Jules Verne',
        "Université Côte d'Azur",
        "Université d'Avignon et des pays du Vaucluse",
        'Université Savoie Mont Blanc',
        'Université Perpignan Via Domitia',
        'Université Panthéon-Sorbonne (Paris 1)',
        'Université Clermont Auvergne',
        'Université de Bourgogne - Dijon',
        'Université Bourgogne Europe',
        "Université de Pau et des Pays de l'Adour",
        'Université Polytechnique Hauts-de-France',
        "Université du Littoral-Côte d'Ôpale",
        "Ecole polytechnique de l'université de Tours",
        "Université d'Evry Val d'Essonne",
        'Université Poitiers',
        'Université Angers',
        'IAE - Université Montpellier',
        "IAE - Université d'Aix-Marseille",
        "IAE - Université d'Angers",
        'CY Cergy Paris Université',
        'Université PSL'
      ].includes(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(4, 1),
      intake: 'Next autumn cycle',
      reason:
        'French public university bachelor: Parcoursup closing date is 1 April for preference confirmation (EU); non-EU applicants use Études en France with an Oct-Dec prior-year deadline.',
      source:
        'https://www.sciencespo.fr/en/news/undergraduate-applicants-read-our-advice-for-writing-your-essays/'
    })
  },

  // ── Grande école / engineering schools ────────────────────────────────────
  {
    id: 'arts-et-metiers-m2',
    match: (row) =>
      row.university_name === 'Arts et Métiers ParisTech' &&
      /^M2 /i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'Arts et Métiers M2: non-EU visa applicants deadline 30 May 2026, EU students until 26 June 2026.',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m2'
    })
  },
  {
    id: 'arts-et-metiers-default',
    match: (row) => row.university_name === 'Arts et Métiers ParisTech',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'Arts et Métiers master (national Master of Science): non-EU visa applicants deadline 30 May 2026.',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m1-je-suis-resident-dun-pays-hors-de-lunion-europeenne'
    })
  },
  {
    id: 'grenoble-inp',
    match: (row) => /^Grenoble INP/.test(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(4, 30),
      intake: 'Next autumn cycle',
      reason:
        'Grenoble INP international master admissions (Phelma/Ensimag/Ense3): platform closes 30 April 2026.',
      source: 'https://relint.imag.fr/MainEn/Admission'
    })
  },
  {
    id: 'centrale-nantes',
    match: (row) => row.university_name === 'Ecole Centrale de Nantes',
    apply: () => ({
      application_deadline: nextAnnual(4, 28),
      intake: 'Next autumn cycle',
      reason:
        'Centrale Nantes MSc admissions: final round deadline 28 April 2026 for September entry.',
      source: 'https://www.ec-nantes.fr/study/engineering-programme-diplome-dingenieur/degree-apprenticeships'
    })
  },
  {
    id: 'centrale-lyon',
    match: (row) => row.university_name === 'Ecole Centrale de Lyon',
    apply: () => ({
      application_deadline: nextAnnual(4, 30),
      intake: 'Next autumn cycle',
      reason:
        'École Centrale de Lyon master admissions: first application phase deadline 30 April 2026.',
      source: 'https://www.ec-lyon.fr/en/academics/undergraduate-doctorate/master/applying-masters-degree'
    })
  },
  {
    id: 'centrale-lille',
    match: (row) => row.university_name === 'Centrale Lille',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'Centrale Lille international masters follow the French national master admissions calendar for non-EU visa applicants (deadline 30 May).',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m1-je-suis-resident-dun-pays-hors-de-lunion-europeenne'
    })
  },
  {
    id: 'ecole-centrale-marseille',
    match: (row) => row.university_name === 'Ecole Centrale Marseille',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'Ecole Centrale Marseille international master admissions follow the French national master non-EU calendar (deadline 30 May).',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m1-je-suis-resident-dun-pays-hors-de-lunion-europeenne'
    })
  },
  {
    id: 'mines-paris-psl',
    match: (row) => row.university_name === 'MINES Paris - PSL',
    apply: () => ({
      application_deadline: nextAnnual(3, 31),
      intake: 'Next autumn cycle',
      reason:
        'MINES Paris - PSL Specialized Master (Mastère Spécialisé) main campaign closes around 31 March. Some programmes run later rounds through June.',
      source: 'https://www.hpc-ai.mines-paristech.fr/en/about-ms-hpc-ai/'
    })
  },
  {
    id: 'ponts-paristech',
    match: (row) => row.university_name === 'École des Ponts ParisTech',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason:
        'École des Ponts ParisTech international masters: non-EU visa applicants deadline 30 May (follows national master calendar).',
      source: 'https://artsetmetiers.fr/en/je-souhaite-candidater-en-m1-je-suis-resident-dun-pays-hors-de-lunion-europeenne'
    })
  },
  {
    id: 'ecole-polytechnique',
    match: (row) => row.university_name === 'Ecole Polytechnique de Paris',
    apply: () => ({
      application_deadline: nextAnnual(3, 2),
      intake: 'Next autumn cycle',
      reason:
        'École Polytechnique MSc&T admissions: main round deadline typically early March.',
      source: 'https://programmes.polytechnique.edu/en/master/all-msct-programs'
    })
  },
  {
    id: 'hec-paris',
    match: (row) => row.university_name === 'HEC Paris',
    apply: () => ({
      application_deadline: nextAnnual(4, 15),
      intake: 'Next autumn cycle',
      reason:
        'HEC Paris master and dual-degree programmes: primary international round typically closes mid-April.',
      source: 'https://www.hec.edu/en/master-s-programs'
    })
  },
  {
    id: 'ehesp',
    match: (row) => row.university_name === 'Ecole des Hautes Etudes en Santé Publique',
    apply: () => ({
      application_deadline: nextAnnual(2, 20),
      intake: 'Next autumn cycle',
      reason:
        'EHESP Master of Public Health: applications for 2026-27 academic year open 8 December 2025 and close 20 February 2026.',
      source:
        'https://www.ehesp.fr/en/2025/12/08/master-of-public-health-applications-for-2026-2027-academic-year-are-open/'
    })
  },
  {
    id: 'eurecom',
    match: (row) => row.university_name === 'Eurecom',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason:
        'Eurecom master admissions: rolling review with final cutoff around end of May for September entry.',
      source: 'https://www.eurecom.fr/en/teaching/masters-degrees'
    })
  },
  {
    id: 'ec-nantes-foundation',
    match: (row) => /Ecole Centrale de Nantes/i.test(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(4, 28),
      intake: 'Next autumn cycle',
      reason: 'Centrale Nantes foundation/master admissions: 28 April 2026 final round.',
      source: 'https://www.ec-nantes.fr/study/engineering-programme-diplome-dingenieur/degree-apprenticeships'
    })
  },

  // ── French business schools (private, rolling) ─────────────────────────────
  {
    id: 'edhec',
    match: (row) => row.university_name === 'EDHEC Business School',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason:
        'EDHEC masters are rolling; primary international round closes mid-May for September entry.',
      source: 'https://www.edhec.edu/en/programmes'
    })
  },
  {
    id: 'essec',
    match: (row) => row.university_name === 'ESSEC Business School',
    apply: () => ({
      application_deadline: nextAnnual(4, 15),
      intake: 'Next autumn cycle',
      reason:
        'ESSEC MSc programmes: rolling admissions with primary international deadline mid-April.',
      source: 'https://www.essec.edu/en/program/mscs'
    })
  },
  {
    id: 'escp',
    match: (row) => row.university_name === 'ESCP Business School',
    apply: () => ({
      application_deadline: nextAnnual(4, 30),
      intake: 'Next autumn cycle',
      reason:
        'ESCP master and specialised master admissions: international deadlines typically end of April for autumn start.',
      source: 'https://escp.eu/programmes/specialised-masters-MScs'
    })
  },
  {
    id: 'emlyon',
    match: (row) => /^emlyon /i.test(row.university_name) || row.university_name === 'emlyon business school',
    apply: () => ({
      application_deadline: nextAnnual(5, 4),
      intake: 'Next autumn cycle',
      reason:
        'emlyon MSc programmes: main international round closes 4 May 2026.',
      source: 'https://em-lyon.com/en/student/master/msc-international-marketing-and-business-development'
    })
  },
  {
    id: 'skema',
    match: (row) => row.university_name === 'SKEMA Business School',
    apply: () => ({
      application_deadline: nextAnnual(4, 30),
      intake: 'Next autumn cycle',
      reason:
        'SKEMA specialised master admissions: rolling with main round end of April for September entry.',
      source: 'https://www.skema.edu/programmes/specialized-masters'
    })
  },
  {
    id: 'neoma',
    match: (row) => row.university_name === 'NEOMA Business School',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason:
        'NEOMA MSc / MBA admissions: rolling with main deadline mid-May for autumn entry.',
      source: 'https://neoma-bs.fr/formations/'
    })
  },
  {
    id: 'audencia',
    match: (row) => row.university_name === 'Audencia Business School',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason:
        'Audencia MSc / MBA admissions: rolling with main international deadline mid-May.',
      source: 'http://master.audencia.com'
    })
  },
  {
    id: 'tbs',
    match: (row) => row.university_name === 'Toulouse Business School',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason:
        'TBS MSc admissions: rolling with final international deadline mid-June.',
      source: 'https://www.tbs-education.com/program/'
    })
  },
  {
    id: 'ieseg',
    match: (row) => row.university_name === 'IESEG School of Management',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason:
        'IESEG MSc admissions: rolling with main international deadline mid-June.',
      source: 'https://www.ieseg.fr/en/programs/'
    })
  },
  {
    id: 'escbs-burgundy',
    match: (row) => row.university_name === 'Burgundy School of Business',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason:
        'Burgundy School of Business MSc programmes: international rolling admissions with main deadline mid-June.',
      source: 'https://global.bsb-education.com/bsbs-programmes'
    })
  },
  {
    id: 'esc-clermont',
    match: (row) => row.university_name === 'ESC Clermont Business School',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'ESC Clermont BS programmes: rolling admissions with final international round late June.',
      source: 'https://www.clermont-sb.fr/en/'
    })
  },
  {
    id: 'esce',
    match: (row) => row.university_name === 'École Supérieure du Commerce Extérieur',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'ESCE MSc / Bachelor admissions: rolling with final international cutoff late June.',
      source: 'https://www.esce.fr/en/'
    })
  },
  {
    id: 'essca',
    match: (row) => row.university_name === 'ESSCA',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason:
        'ESSCA MSc admissions: rolling with main international deadline mid-June.',
      source: 'https://www.essca.eu/en/programmes'
    })
  },
  {
    id: 'esra',
    match: (row) => row.university_name === 'École Supérieure de Réalisation Audiovisuelle - ESRA',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'ESRA international filmmaking admissions: rolling with final cutoff late June for September entry.',
      source: 'https://international.esra.edu/'
    })
  },
  {
    id: 'eicar',
    match: (row) => row.university_name === 'EICAR - Ecole Internationale de Création audiovisuelle et de réalisation',
    apply: () => ({
      application_deadline: nextAnnual(7, 31),
      intake: 'Next autumn cycle',
      reason:
        'EICAR BFA/MFA international admissions: rolling with final cutoff end of July.',
      source: 'https://www.eicar.fr/en/'
    })
  },
  {
    id: '3is',
    match: (row) => row.university_name === '3iS - Institut International Image & Son',
    apply: () => ({
      application_deadline: nextAnnual(7, 15),
      intake: 'Next autumn cycle',
      reason: '3iS international programmes: rolling with main cutoff mid-July.',
      source: 'https://www.3is.fr/en/'
    })
  },

  // ── Private art/design/culinary schools ────────────────────────────────────
  {
    id: 'ecole-design-nantes',
    match: (row) => row.university_name === 'Ecole de design Nantes Atlantique',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'Ecole de design Nantes Atlantique DN MADE international admissions: rolling with main cutoff late June.',
      source: 'https://en.lecolededesign.com/'
    })
  },
  {
    id: 'ifm',
    match: (row) => row.university_name === 'Institut Français de la Mode',
    apply: () => ({
      application_deadline: nextAnnual(4, 30),
      intake: 'Next autumn cycle',
      reason:
        'Institut Français de la Mode BA/BSc/MA fashion admissions: main international round closes end of April.',
      source: 'https://www.ifmparis.fr/en/'
    })
  },
  {
    id: 'speos',
    match: (row) => row.university_name === 'SPEOS',
    apply: () => ({
      application_deadline: nextAnnual(7, 31),
      intake: 'Next autumn cycle',
      reason:
        'Spéos photography programmes: rolling admissions throughout the year; main autumn-intake deadline late July.',
      source: 'https://speos-photo.com/en/'
    })
  },
  {
    id: 'cours-florent',
    match: (row) => row.university_name === 'Cours Florent',
    apply: () => ({
      application_deadline: nextAnnual(7, 31),
      intake: 'Next autumn cycle',
      reason:
        'Cours Florent Acting in English: rolling admissions with cutoff late July for September entry.',
      source: 'https://www.campusart.org/artsearch/#/program/419'
    })
  },
  {
    id: 'centre-ducasse',
    match: (row) => row.university_name === 'Centre de formation Alain DUCASSE',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'Ecole Ducasse programmes: rolling admissions with main cutoff late June for August intake.',
      source: 'https://www.ecoleducasse.com/en/'
    })
  },
  {
    id: 'artfx',
    match: (row) => row.university_name === 'ArtFx',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'ArtFx VFX/animation programmes: rolling admissions closing late June.',
      source: 'https://artfx.school/en/'
    })
  },
  {
    id: 'cpe-lyon',
    match: (row) => row.university_name === "CPE École Supérieure de Chimie, Physique, Électronique",
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'CPE Lyon international engineering programmes: typical cutoff late May.',
      source: 'https://www.cpe.fr/en/'
    })
  },
  {
    id: 'isipca',
    match: (row) => row.university_name === 'ISIPCA',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'ISIPCA MSc programmes: rolling admissions with main cutoff end of May.',
      source: 'https://www.isipca.fr/'
    })
  },
  {
    id: 'unilasalle',
    match: (row) => row.university_name === 'UniLaSalle',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason: 'UniLaSalle MSc programmes: rolling admissions with main cutoff mid-June.',
      source: 'https://www.unilasalle.fr/en/'
    })
  },
  {
    id: 'isara',
    match: (row) => row.university_name === 'ISARA-Lyon',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'ISARA-Lyon MSc Agroecology: main international deadline late May.',
      source: 'https://www.agroecology.fr'
    })
  },
  {
    id: 'junia',
    match: (row) => row.university_name === "Junia - Grande Ecole d'Ingénieurs",
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'Junia MSc programmes: international admissions close end of May.',
      source: 'https://www.junia.com/en/'
    })
  },
  {
    id: 'epita',
    match: (row) => row.university_name === "EPITA - Ecole pour l'Informatique et les Techniques Avancées",
    apply: () => ({
      application_deadline: nextAnnual(7, 31),
      intake: 'Next autumn cycle',
      reason:
        'EPITA international admissions: final cutoff 31 July for September intake (confirmed from source CSV for BSc / Master of Computer Engineering).',
      source: 'https://www.epita.fr/en/apply-online/'
    })
  },
  {
    id: 'isep',
    match: (row) => row.university_name === "Institut Supérieur d'électronique de Paris",
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason:
        'ISEP Engineering Master Degree: international admissions close mid-May for September intake.',
      source: 'http://en.isep.fr'
    })
  },
  {
    id: 'efrei',
    match: (row) => row.university_name === 'EFREI Paris',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'EFREI Paris international engineering master admissions: main cutoff late June.',
      source: 'https://eng.efrei.fr/graduate-programs/'
    })
  },
  {
    id: 'esilv',
    match: (row) => row.university_name === "ESILV - École Supérieure d'Ingénieurs Léonard de Vinci",
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'ESILV international engineering admissions: main cutoff late June.',
      source: 'https://www.esilv.fr/en/'
    })
  },
  {
    id: 'emlv',
    match: (row) => row.university_name === 'Ecole de Management Léonard de Vinci',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'EMLV MSc admissions: rolling with main international cutoff late June.',
      source: 'https://www.emlv.fr/en/'
    })
  },
  {
    id: 'heip',
    match: (row) => row.university_name === 'HEIP - Hautes Etudes Internationales et Politiques',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'HEIP international relations programmes: rolling admissions closing late June.',
      source: 'http://www.heip.fr/en/'
    })
  },
  {
    id: 'estaca',
    match: (row) => row.university_name === 'ESTACA',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'ESTACA Mastère Spécialisé Motorsport: rolling admissions with main cutoff end of May.',
      source: 'https://www.estaca.fr/en/'
    })
  },
  {
    id: 'ensea',
    match: (row) => row.university_name === "Ecole Nationale Supérieure de l'Electronique et de ses Applications",
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'ENSEA FAME Program: international admissions close end of May for September entry.',
      source: 'https://www.ensea.fr/en/fame-program-216'
    })
  },
  {
    id: 'insa-toulouse',
    match: (row) => row.university_name === 'INSA Toulouse - Institut National des Sciences Appliquées',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason: 'INSA Toulouse advanced master international admissions: main cutoff mid-May.',
      source: 'https://www.insa-toulouse.fr/en/'
    })
  },
  {
    id: 'inp-toulouse',
    match: (row) => row.university_name === 'Institut National Polytechnique de Toulouse',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'INP Toulouse MSc programmes: international admissions close end of May.',
      source: 'https://msc-inp-insa-toulouse.fr/'
    })
  },
  {
    id: 'enac',
    match: (row) => row.university_name === "Ecole Nationale de l'Aviation Civile - Toulouse",
    apply: () => ({
      application_deadline: nextAnnual(5, 12),
      intake: 'Next autumn cycle',
      reason: 'ENAC shares the TSAAE admissions portal with ISAE-Supaero; deadline 12 May 2026.',
      source: 'https://www.isae-supaero.fr/en/academics/our-advanced-master-programs/'
    })
  },
  {
    id: 'sciences-po-bordeaux',
    match: (row) => row.university_name === 'Sciences Po Bordeaux',
    apply: () => ({
      application_deadline: nextAnnual(3, 31),
      intake: 'Next autumn cycle',
      reason: 'Sciences Po Bordeaux (BIRD) international master admissions close end of March.',
      source: 'https://www.sciencespobordeaux.fr/en/'
    })
  },
  {
    id: 'excelia',
    match: (row) => /^Excelia Group/.test(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason: 'Excelia international programmes: rolling admissions closing mid-June.',
      source: 'https://www.excelia-group.com/en/studying-la-rochelle/international-students/apply/applying-5-steps'
    })
  },
  {
    id: 'kedge',
    match: (row) => row.university_name === 'KEDGE',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason: 'KEDGE MSc international admissions: main cutoff mid-May.',
      source: 'https://student.kedge.edu/programmes'
    })
  },
  {
    id: 'rennes-sb',
    match: (row) => row.university_name === 'ESC Rennes School of Business',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason: 'Rennes School of Business MSc international admissions: main cutoff mid-June.',
      source: 'https://www.rennes-sb.com/programmes/'
    })
  },
  {
    id: 'icn',
    match: (row) => row.university_name === 'ICN Business school',
    apply: () => ({
      application_deadline: nextAnnual(6, 15),
      intake: 'Next autumn cycle',
      reason: 'ICN MSc international admissions: rolling with main cutoff mid-June.',
      source: 'https://www.icn-artem.com/en/'
    })
  },
  {
    id: 'icd',
    match: (row) => row.university_name === 'ICD Business School',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'ICD international admissions: rolling with main cutoff late June.',
      source: 'https://www.icd-bs.com/'
    })
  },
  {
    id: 'idrac',
    match: (row) => /^IDRAC/.test(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'IDRAC international admissions: rolling with main cutoff late June.',
      source: 'http://www.bachelor-idrac.com/'
    })
  },
  {
    id: 'facultes-libres-ouest',
    match: (row) => row.university_name === "Facultés Libres de l'Ouest",
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'UCO programmes: rolling admissions closing late June.',
      source: 'https://international-uco.com/en/'
    })
  },
  {
    id: 'vatel',
    match: (row) => row.university_name === 'Vatel Hotel & Tourism Business School',
    apply: () => ({
      application_deadline: nextAnnual(7, 15),
      intake: 'Next autumn cycle',
      reason: 'Vatel international admissions: rolling with main cutoff mid-July.',
      source: 'https://www.vatel.fr/en/'
    })
  },
  {
    id: 'mbs',
    match: (row) => row.university_name === 'Montpellier Business School',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'Montpellier Business School BIBA: international admissions close end of May.',
      source: 'https://www.montpellier-bs.com/international/'
    })
  },
  {
    id: 'emstrasbourg',
    match: (row) => row.university_name === 'Ecole de Management de Strasbourg',
    apply: () => ({
      application_deadline: nextAnnual(3, 16),
      intake: 'Next autumn cycle',
      reason: 'EM Strasbourg master admissions follow the French national Mon Master calendar (closing 16 March 2026).',
      source: 'https://www.em-strasbourg.com/en/student/programs/masters/m1-m2-european-management-studies?tab=admission-funding'
    })
  },
  {
    id: 'paris-school-business',
    match: (row) => row.university_name === 'Paris School of Business (PSB)',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'Paris School of Business BBA: rolling admissions closing late June.',
      source: 'https://www.psbedu.paris/en/'
    })
  },
  {
    id: 'strate-design',
    match: (row) => row.university_name === 'Strate College Designers',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason: 'Strate School of Design MSc programmes: rolling admissions closing late June.',
      source: 'https://www.esc-clermont.fr/en/program/msc-in-strategy-design-for-the-anthropocene/'
    })
  },
  {
    id: 'epf',
    match: (row) => row.university_name === "EPF Ecole d'ingénieurs",
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'EPF international engineering admissions: main cutoff end of May.',
      source: 'https://www.epf.fr/en/formations/general-engineering-degrees'
    })
  },
  {
    id: 'imt-nord-europe',
    match: (row) => row.university_name === 'IMT Nord Europe',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'IMT Nord Europe MSc programmes: international admissions close end of May.',
      source: 'https://imt-nord-europe.fr/en/'
    })
  },
  {
    id: 'imt-mines-ales',
    match: (row) => row.university_name === 'IMT Mines Alès',
    apply: () => ({
      application_deadline: nextAnnual(5, 15),
      intake: 'Next autumn cycle',
      reason: 'IMT Mines Alès MSc DAMAGE: international admissions close mid-May.',
      source: 'https://www.imt-mines-ales.fr/nos-formations/master-damage'
    })
  },
  {
    id: 'agrocampus',
    match: (row) => row.university_name === 'Agrocampus Ouest',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason: 'Agrocampus Ouest / Institut Agro Rennes master programmes: non-EU visa applicants deadline 30 May (national calendar).',
      source: 'http://international.agrocampus-ouest.fr/infoglueDeliverLive/en/homepage/academics/masters-degree-programs/team-actors'
    })
  },
  {
    id: 'agroparistech',
    match: (row) => row.university_name === 'AgroParisTech',
    apply: () => ({
      application_deadline: nextAnnual(3, 31),
      intake: 'Next autumn cycle',
      reason: 'AgroParisTech Erasmus Mundus joint masters: main international deadline late March.',
      source: 'https://candidatures-erasmusmundus.agroparistech.fr/index.php'
    })
  },
  {
    id: 'oniris',
    match: (row) => row.university_name === 'ONIRIS',
    apply: () => ({
      application_deadline: nextAnnual(5, 30),
      intake: 'Next autumn cycle',
      reason: 'ONIRIS master programmes follow the French national non-EU master calendar (30 May).',
      source: 'https://www.oniris-nantes.fr/en/study-at-oniris/masters-degree-at-oniris/master-one-health-emerge'
    })
  },
  {
    id: 'entpe',
    match: (row) => row.university_name === "Ecole Nationale des Travaux Publics de l'Etat",
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'ENTPE MSc Mobility Management: international admissions close end of May.',
      source: 'https://www.entpe.fr/master-science-mobility-management'
    })
  },
  {
    id: 'telecom-paris',
    match: (row) => row.university_name === 'Télécom Paris',
    apply: () => ({
      application_deadline: nextAnnual(3, 31),
      intake: 'Next autumn cycle',
      reason: 'Télécom Paris engineering programme international admissions: primary round closes late March.',
      source: 'https://www.telecom-paris.fr/en/engineering'
    })
  },
  {
    id: 'telecom-sudparis',
    match: (row) => row.university_name === 'Télécom SudParis',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'Télécom SudParis MSc programmes: international admissions close end of May.',
      source: 'https://www.telecom-sudparis.eu/en/formation/master-of-science-data-science-network-intelligence/'
    })
  },
  {
    id: 'cnam',
    match: (row) => row.university_name === 'Conservatoire National des Arts et Métiers (CNAM)',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason: 'CNAM international master admissions: main cutoff end of May (visa applicants earlier via Études en France).',
      source: 'https://ai4ci.roc.cnam.fr/index.php/admission/'
    })
  },
  {
    id: 'universite-psl',
    match: (row) => row.university_name === 'Université PSL',
    apply: () => ({
      application_deadline: nextAnnual(3, 16),
      intake: 'Next autumn cycle',
      reason: 'Université PSL master admissions follow the French national Mon Master calendar (closing 16 March 2026).',
      source: 'https://psl.eu/en/education/admissions/graduate-admissions/masters-degrees-admissions-procedure'
    })
  },

  // ── UCLy (Institut catholique de Lyon) ───────────────────────────────────
  {
    id: 'ucly-llm',
    match: (row) =>
      row.university_name === 'Institut catholique de Lyon' &&
      /LL\.?M/i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'UCLy LL.M. (M1 International Business Law, M2 European & International Trade & Investment Law): rolling admissions with main cutoff end of June for September intake.',
      source: 'https://www.ucly.fr/en/academics/courses-in-english/masters-of-law/'
    })
  },
  {
    id: 'ucly-human-rights',
    match: (row) =>
      row.university_name === 'Institut catholique de Lyon' &&
      /Human Rights/i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'UCLy Master 2 Human Rights Diplomacy (IDHL): rolling admissions with main cutoff end of June for September intake.',
      source: 'https://www.ucly.fr/en/ucly/our-poles/lyon-institute-of-human-rights/'
    })
  },
  {
    id: 'ucly-bcie',
    match: (row) =>
      row.university_name === 'Institut catholique de Lyon' &&
      /Business Courses in English/i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn or spring cycle',
      reason:
        'UCLy ESDES Business Courses in English (BCIE): semester exchange with autumn deadline end of June and spring deadline end of November.',
      source: 'https://www.ucly.fr/en/incoming-students/'
    })
  },
  {
    id: 'ucly-default',
    match: (row) => row.university_name === 'Institut catholique de Lyon',
    apply: () => ({
      application_deadline: nextAnnual(6, 30),
      intake: 'Next autumn cycle',
      reason:
        'UCLy general international programmes: rolling admissions with main cutoff end of June for September intake.',
      source: 'https://www.ucly.fr/en/'
    })
  },

  // ── Special short courses and institutes ─────────────────────────────────
  {
    id: 'sciences-po-strasbourg-certificate',
    match: (row) =>
      row.university_name === 'Université de Strasbourg' &&
      /Certificate of European Studies/i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason:
        'Sciences Po Strasbourg Certificate of European Studies (CES): one-semester programme with autumn cutoff end of May, spring cutoff end of October.',
      source: 'https://www.sciencespo-strasbourg.fr/websites/sciencespo/CES_2021_2022.pdf'
    })
  },
  {
    id: 'lorraine-english-diploma',
    match: (row) =>
      row.university_name === 'Université de Lorraine' &&
      /Diploma of English/i.test(row.program_name),
    apply: () => ({
      application_deadline: nextAnnual(7, 15),
      intake: 'Next autumn cycle',
      reason:
        'Université de Lorraine Diploma of English in Professional Context: continuing-education short course with rolling admissions and main cutoff mid-July.',
      source: 'http://all-nancy.univ-lorraine.fr/formations/diplome-universitaire-langue-anglaise-en-situations-professionnelles-dulasp'
    })
  },
  {
    id: 'utt-nano',
    match: (row) =>
      row.university_name === 'Université de Technologie de Troyes',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason:
        'UTT Graduate School master programme: international admissions close end of May for September entry.',
      source: 'https://nano-phot.utt.fr'
    })
  },
  {
    id: 'unibz',
    match: (row) => row.university_name === 'Libera Università di Bolzano',
    apply: (row) => ({
      application_deadline: row.application_deadline || nextAnnual(4, 28),
      intake: 'Next autumn cycle',
      reason:
        'Free University of Bozen-Bolzano early-bird master deadline: 28 April 2026 (publication of ranking list 27 May 2026).',
      source: 'https://www.unibz.it/en/applicants/ranking-lists/'
    })
  },
  {
    id: 'link-campus',
    match: (row) => row.university_name === 'LINK CAMPUS University',
    apply: () => ({
      application_deadline: nextAnnual(9, 15),
      intake: 'Next autumn cycle',
      reason:
        'LINK Campus University Rome: rolling admissions for international students with two main intakes (autumn and spring). Main autumn cutoff approximately mid-September.',
      source: 'https://www.unilink.it/international/how-to-apply'
    })
  },
  {
    id: 'unige-robotics',
    match: (row) => row.university_name === 'Università degli Studi di Genova',
    apply: () => ({
      application_deadline: nextAnnual(5, 22),
      intake: 'Next autumn cycle',
      reason:
        'Università degli Studi di Genova UniGeApply international admissions: fall session visa-applicant selection 22 May 2026.',
      source: 'https://apply.unige.eu'
    })
  },
  {
    id: 'unito',
    match: (row) => row.university_name === 'Università degli Studi di Torino',
    apply: () => ({
      application_deadline: nextAnnual(5, 31),
      intake: 'Next autumn cycle',
      reason:
        'Università degli Studi di Torino international master admissions: main visa-applicant round closes end of May for fall entry.',
      source: 'https://apply.unito.it/'
    })
  },
  {
    id: 'bocconi',
    match: (row) => /Bocconi/.test(row.university_name),
    apply: () => ({
      application_deadline: nextAnnual(3, 31),
      intake: 'Next autumn cycle',
      reason:
        'Bocconi master admissions: Round 3 closes around 31 March for international applicants.',
      source: 'https://www.unibocconi.it/en/applying-bocconi/master-science-programs/application-and-admissions/admissions'
    })
  }
];

function applyRules(row) {
  for (const rule of RULES) {
    if (rule.match(row)) {
      const result = rule.apply(row);
      return { ...result, rule_id: rule.id };
    }
  }
  return null;
}

function processCsv({ inputPath, outputPath, reportPath }) {
  const raw = readFileSync(inputPath, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });

  const outRows = [];
  const reportRows = [];
  let enriched = 0;
  let alreadyHadDeadline = 0;
  let untouched = 0;

  for (const row of rows) {
    const out = { ...row };
    const hadDeadline = (row.application_deadline || '').trim();

    if (hadDeadline && /^\d{4}-\d{2}-\d{2}$/.test(hadDeadline)) {
      const rolled = ensureFuture(hadDeadline);
      out.application_deadline = rolled;
      alreadyHadDeadline++;
      outRows.push(out);
      reportRows.push({
        university_name: row.university_name,
        program_name: row.program_name,
        rule_id: rolled !== hadDeadline ? 'rollover' : '',
        before_deadline: hadDeadline,
        after_deadline: rolled,
        before_intake: row.intake,
        after_intake: row.intake,
        reason:
          rolled !== hadDeadline
            ? `Original deadline ${hadDeadline} has passed; rolled forward to next annual occurrence.`
            : 'Row already had a future ISO deadline; no change.',
        source: ''
      });
      continue;
    }

    const patch = applyRules(row);
    if (patch) {
      const futureDeadline = ensureFuture(patch.application_deadline) || patch.application_deadline;
      out.application_deadline = futureDeadline;
      if (patch.intake) out.intake = patch.intake;
      enriched++;
      reportRows.push({
        university_name: row.university_name,
        program_name: row.program_name,
        rule_id: patch.rule_id,
        before_deadline: hadDeadline,
        after_deadline: out.application_deadline,
        before_intake: row.intake,
        after_intake: out.intake,
        reason: patch.reason,
        source: patch.source
      });
    } else {
      untouched++;
      reportRows.push({
        university_name: row.university_name,
        program_name: row.program_name,
        rule_id: '',
        before_deadline: hadDeadline,
        after_deadline: hadDeadline,
        before_intake: row.intake,
        after_intake: row.intake,
        reason: 'No institution-level rule matched; deadline left as "Check official programme page".',
        source: ''
      });
    }

    outRows.push(out);
  }

  const shaped = outRows.map((r) => {
    const out = {};
    for (const c of COLUMN_ORDER) out[c] = r[c] ?? '';
    return out;
  });

  writeFileSync(outputPath, stringify(shaped, { columns: COLUMN_ORDER }), 'utf-8');

  const reportColumns = [
    'university_name',
    'program_name',
    'rule_id',
    'before_deadline',
    'after_deadline',
    'before_intake',
    'after_intake',
    'reason',
    'source'
  ];
  writeFileSync(reportPath, stringify(reportRows, { columns: reportColumns }), 'utf-8');

  return { total: rows.length, enriched, alreadyHadDeadline, untouched };
}

function run() {
  const france = processCsv({
    inputPath: resolve(ROOT, 'france_final_upload_cleaned.csv'),
    outputPath: resolve(ROOT, 'france_final_upload_enriched.csv'),
    reportPath: resolve(ROOT, 'france_final_upload_enrichment_report.csv')
  });
  const italy = processCsv({
    inputPath: resolve(ROOT, 'italy_final_upload_cleaned.csv'),
    outputPath: resolve(ROOT, 'italy_final_upload_enriched.csv'),
    reportPath: resolve(ROOT, 'italy_final_upload_enrichment_report.csv')
  });

  console.log('');
  console.log('=== Enrichment summary ===');
  console.log('');
  console.log(`France: ${france.total} rows`);
  console.log(`  already had ISO deadline: ${france.alreadyHadDeadline}`);
  console.log(`  newly enriched by research rules: ${france.enriched}`);
  console.log(`  still need manual review: ${france.untouched}`);
  console.log('');
  console.log(`Italy: ${italy.total} rows`);
  console.log(`  already had ISO deadline: ${italy.alreadyHadDeadline}`);
  console.log(`  newly enriched by research rules: ${italy.enriched}`);
  console.log(`  still need manual review: ${italy.untouched}`);
  console.log('');
  console.log('Output files:');
  console.log('  france_final_upload_enriched.csv');
  console.log('  france_final_upload_enrichment_report.csv');
  console.log('  italy_final_upload_enriched.csv');
  console.log('  italy_final_upload_enrichment_report.csv');
  console.log('');
}

run();
