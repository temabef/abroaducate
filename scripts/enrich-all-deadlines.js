/**
 * Enrich application_close_date on every program in Supabase so that:
 *   - every row has a future ISO date
 *   - past dates are rolled forward to their next annual occurrence
 *   - blank dates are filled via two mechanisms, in priority order:
 *       (1) parse a date out of deadline_summary (DD.MM.YYYY or ISO)
 *       (2) apply an institution-level rule we researched
 *
 * Countries covered by rules:
 *   - France and Italy already done via enrich-france-italy-deadlines.js
 *   - Germany: Uni-Assist standard national dates (Jul 15 / Jan 15)
 *   - Czechia: Charles University Apr 30, generic Czech public Jun 30
 *   - Sweden: National admissions (Jan 15 spring / Apr 15 autumn - summer)
 *   - Austria: Linz, Leoben, Technikum Wien, Salzburg - institutional dates
 *   - Estonia: Tartu Mar 15, TalTech May 1, generic DreamApply Mar 15
 *   - Lithuania: Vilnius Univ Mar 31, KTU rolling May 31
 *   - Poland: Warsaw UT Jul 21, UW Jul 9, PWr rolling May 31
 *
 * Usage:
 *   node scripts/enrich-all-deadlines.js --dry-run
 *   node scripts/enrich-all-deadlines.js --apply
 *   node scripts/enrich-all-deadlines.js --apply --country Germany
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const countryFilterIdx = process.argv.indexOf('--country');
const COUNTRY_FILTER = countryFilterIdx >= 0 ? process.argv[countryFilterIdx + 1] : null;

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TODAY = new Date();
const ROLLOVER_BUFFER_DAYS = 14;

function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function nextAnnual(month, day) {
  const year = TODAY.getFullYear();
  const thisYear = new Date(Date.UTC(year, month - 1, day));
  const cutoff = new Date(TODAY.getTime() + ROLLOVER_BUFFER_DAYS * 24 * 60 * 60 * 1000);
  if (thisYear.getTime() >= cutoff.getTime()) return iso(year, month, day);
  return iso(year + 1, month, day);
}

function rollForwardIso(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const cutoffMs = TODAY.getTime() + ROLLOVER_BUFFER_DAYS * 24 * 60 * 60 * 1000;
  let year = y;
  let candidate = new Date(Date.UTC(year, mo - 1, d));
  while (candidate.getTime() < cutoffMs) {
    year += 1;
    candidate = new Date(Date.UTC(year, mo - 1, d));
  }
  return iso(year, mo, d);
}

// ── Summary parsers ─────────────────────────────────────────────────────────

// Parse "DD.MM.YYYY - DD.MM.YYYY" (German format). We take the closing date.
function parseGermanRange(text) {
  const s = String(text || '').trim();
  // Match two dates, pick the second
  const matches = [...s.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const d = Number(last[1]);
  const mo = Number(last[2]);
  const y = Number(last[3]);
  if (!d || !mo || !y) return null;
  return iso(y, mo, d);
}

// Parse a plain ISO date at the start of the string (Czechia format)
function parseIsoStart(text) {
  const s = String(text || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// ── Country rules ───────────────────────────────────────────────────────────
//
// Each rule applies to programs whose (country, university_name?) match.
// Rules are evaluated only when the row has NO ISO close date AND
// deadline_summary parsing didn't yield a date. They return a month/day pair
// that is then run through nextAnnual().

const RULES = [
  // ── Germany: Uni-Assist standard dates ───────────────────────────────────
  // Germany masters open in winter semester (starting October) have
  // deadline July 15. Summer semester (starting April) has January 15.
  // Most international masters in our catalogue are winter-start.
  {
    id: 'germany-uni-assist-winter',
    match: (p) => p.country === 'Germany',
    apply: () => ({
      nextDate: nextAnnual(7, 15),
      reason:
        'Germany Uni-Assist standard application deadline for winter semester (October start): 15 July. Summer semester (April start) closes 15 January. Always check the specific programme page.',
      source: 'https://uni-assist.de/en/how-to-apply/plan-your-application/deadlines-processing-time'
    })
  },

  // ── Czechia ───────────────────────────────────────────────────────────────
  {
    id: 'czechia-charles',
    match: (p) => p.country === 'Czechia' && p.university_name === 'Charles University',
    apply: () => ({
      nextDate: nextAnnual(4, 30),
      reason:
        'Charles University English-taught master programmes: main application deadline 30 April for September start.',
      source: 'https://www.mff.cuni.cz/en/admissions/admission-requirements-for-master-s-programmes-in-english'
    })
  },
  {
    id: 'czechia-generic',
    match: (p) => p.country === 'Czechia',
    apply: () => ({
      nextDate: nextAnnual(6, 30),
      reason:
        'Czech public university master programmes: typical international deadline 30 June for September start. Always check the specific programme page.',
      source: 'https://www.cuni.cz'
    })
  },

  // ── Sweden: universityadmissions.se national dates ───────────────────────
  {
    id: 'sweden-autumn-national',
    match: (p) => p.country === 'Sweden',
    apply: () => ({
      nextDate: nextAnnual(1, 15),
      reason:
        'Sweden universityadmissions.se national deadline for autumn master admissions: 15 January. Spring intake (limited programmes) closes 15 August.',
      source: 'https://www.universityadmissions.se/'
    })
  },

  // ── Austria ──────────────────────────────────────────────────────────────
  {
    id: 'austria-linz',
    match: (p) => p.country === 'Austria' && p.university_name === 'Universität Linz',
    apply: () => ({
      nextDate: nextAnnual(3, 31),
      reason:
        'JKU Linz international master admissions: deadline 31 March for autumn intake, 30 September for spring intake.',
      source: 'https://www.jku.at/en/'
    })
  },
  {
    id: 'austria-leoben',
    match: (p) => p.country === 'Austria' && p.university_name === 'Montanuniversität Leoben',
    apply: () => ({
      nextDate: nextAnnual(4, 30),
      reason:
        'Montanuniversität Leoben international master admissions: deadline 30 April for autumn intake.',
      source: 'https://www.unileoben.ac.at/'
    })
  },
  {
    id: 'austria-technikum-wien',
    match: (p) => p.country === 'Austria' && /Technikum Wien/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(4, 30),
      reason:
        'FH Technikum Wien international admissions: deadline 30 April for autumn intake.',
      source: 'https://www.technikum-wien.at/en/'
    })
  },
  {
    id: 'austria-salzburg',
    match: (p) => p.country === 'Austria' && /Salzburg/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(3, 31),
      reason:
        'FH Salzburg international admissions: typical deadline 31 March for autumn intake.',
      source: 'https://www.fh-salzburg.ac.at/'
    })
  },
  {
    id: 'austria-medwien',
    match: (p) => p.country === 'Austria' && /Medizinische Universität Wien/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(5, 4),
      reason:
        'MedUni Wien master admissions: international application deadline typically early May.',
      source: 'https://www.meduniwien.ac.at/'
    })
  },
  {
    id: 'austria-default',
    match: (p) => p.country === 'Austria',
    apply: () => ({
      nextDate: nextAnnual(4, 30),
      reason:
        'Austrian public university master admissions: typical international deadline end of April for autumn intake.',
      source: 'https://studienwahl.at/'
    })
  },

  // ── Estonia ──────────────────────────────────────────────────────────────
  {
    id: 'estonia-tartu-main',
    match: (p) => p.country === 'Estonia' && p.university_name === 'University of Tartu',
    apply: () => ({
      nextDate: nextAnnual(3, 15),
      reason:
        'University of Tartu international master admissions via DreamApply: deadline 15 March for September start.',
      source: 'https://estonia.dreamapply.com/et_EE/news/new/417-international-admission-university-tartu-has-started'
    })
  },
  {
    id: 'estonia-taltech',
    match: (p) => p.country === 'Estonia' && p.university_name === 'Tallinn University of Technology',
    apply: () => ({
      nextDate: nextAnnual(5, 1),
      reason:
        'TalTech international master admissions via DreamApply: deadline 1 May for September start.',
      source: 'https://estonia.dreamapply.com/'
    })
  },
  {
    id: 'estonia-life-sciences',
    match: (p) => p.country === 'Estonia' && p.university_name === 'Estonian University of Life Sciences',
    apply: () => ({
      nextDate: nextAnnual(4, 20),
      reason:
        'Estonian University of Life Sciences master admissions: deadline 20 April for September start.',
      source: 'https://www.emu.ee/en/admissions/'
    })
  },
  {
    id: 'estonia-default',
    match: (p) => p.country === 'Estonia',
    apply: () => ({
      nextDate: nextAnnual(4, 1),
      reason:
        'Estonian public university master admissions via DreamApply: typical deadline 1 April for September start.',
      source: 'https://www.studyinestonia.ee/'
    })
  },

  // ── Lithuania ────────────────────────────────────────────────────────────
  {
    id: 'lithuania-vilnius-univ',
    match: (p) => p.country === 'Lithuania' && p.university_name === 'Vilnius University',
    apply: () => ({
      nextDate: nextAnnual(5, 31),
      reason:
        'Vilnius University international master admissions: application window closes 31 May for September start; tuition-fee waiver deadline 1 April.',
      source: 'https://apply.vu.lt/'
    })
  },
  {
    id: 'lithuania-ktu',
    match: (p) => p.country === 'Lithuania' && p.university_name === 'Kaunas University of Technology',
    apply: () => ({
      nextDate: nextAnnual(6, 1),
      reason:
        'Kaunas University of Technology international master admissions: institutional admission for foreign citizens closes around 1 June for September start.',
      source: 'https://admissions.ktu.edu/master/'
    })
  },
  {
    id: 'lithuania-vilnius-tech',
    match: (p) =>
      p.country === 'Lithuania' && /Vilnius Gediminas Technical University/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(6, 15),
      reason:
        'VILNIUS TECH international master admissions: typical application deadline mid-June for September start.',
      source: 'https://vilniustech.lt/'
    })
  },
  {
    id: 'lithuania-vdu',
    match: (p) =>
      p.country === 'Lithuania' && /Vytautas Magnus/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(6, 30),
      reason:
        'Vytautas Magnus University international admissions: rolling with main cutoff late June.',
      source: 'http://www.vdu.lt/en/studies/degree-studies/'
    })
  },
  {
    id: 'lithuania-default',
    match: (p) => p.country === 'Lithuania',
    apply: () => ({
      nextDate: nextAnnual(6, 15),
      reason:
        'Lithuanian university international master admissions: typical deadline mid-June for September start.',
      source: 'https://www.studyin.lt/'
    })
  },

  // ── Poland ────────────────────────────────────────────────────────────────
  {
    id: 'poland-warsaw-ut',
    match: (p) =>
      p.country === 'Poland' && /Warsaw University of Technology/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(7, 21),
      reason:
        'Warsaw University of Technology international admissions: create-application deadline 21 July, documents deadline 19 August for October start.',
      source: 'https://www.students.pw.edu.pl/How-to-Apply/Admission-to-B.Sc'
    })
  },
  {
    id: 'poland-wroclaw-ust',
    match: (p) =>
      p.country === 'Poland' && /Wroc.aw University of Science and Technology/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(7, 15),
      reason:
        'Wroclaw University of Science and Technology international admissions: main cutoff mid-July for October start.',
      source: 'https://rekrutacja.pwr.edu.pl/en/for-foreigners/'
    })
  },
  {
    id: 'poland-uw',
    match: (p) => p.country === 'Poland' && p.university_name === 'University of Warsaw',
    apply: () => ({
      nextDate: nextAnnual(7, 9),
      reason:
        'University of Warsaw international admissions: main cycle closes 9 July for October start.',
      source: 'https://en.uw.edu.pl/admissions-for-studies-2025-2026/'
    })
  },
  {
    id: 'poland-lodz-ut',
    match: (p) => p.country === 'Poland' && /Lodz University of Technology/i.test(p.university_name),
    apply: () => ({
      nextDate: nextAnnual(7, 20),
      reason:
        'Lodz University of Technology international admissions: typical deadline late July for October start.',
      source: 'https://apply.p.lodz.pl/en/enrollment/enroll/deadlines'
    })
  },
  {
    id: 'poland-default',
    match: (p) => p.country === 'Poland',
    apply: () => ({
      nextDate: nextAnnual(7, 15),
      reason:
        'Polish public university international admissions: typical deadline mid-July for October start.',
      source: 'https://www.go-poland.pl/'
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

// ── Main ────────────────────────────────────────────────────────────────────

async function fetchAll() {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    let query = supabase
      .from('programs')
      .select('id, country, university_name, program_name, application_close_date, deadline_summary')
      .range(from, from + PAGE - 1);
    if (COUNTRY_FILTER) query = query.eq('country', COUNTRY_FILTER);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  const rows = await fetchAll();
  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}${COUNTRY_FILTER ? ` (country: ${COUNTRY_FILTER})` : ''}`);
  console.log(`Scanning ${rows.length} programs\n`);

  const updates = [];
  const stats = {
    total: rows.length,
    alreadyFuture: 0,
    rolledForward: 0,
    parsedFromSummary: 0,
    filledByRule: 0,
    untouched: 0
  };

  for (const row of rows) {
    const existing = row.application_close_date;
    let newDate = null;
    let reason = '';

    // 1. Already has a future ISO date? skip.
    if (existing) {
      const rolled = rollForwardIso(existing);
      if (rolled && rolled !== existing) {
        newDate = rolled;
        reason = `rolled forward from ${existing}`;
        stats.rolledForward++;
      } else {
        stats.alreadyFuture++;
        continue;
      }
    } else {
      // 2. Try parsing the deadline_summary
      const summary = (row.deadline_summary || '').trim();
      if (summary) {
        const parsed = parseIsoStart(summary) || parseGermanRange(summary);
        if (parsed) {
          newDate = rollForwardIso(parsed) || parsed;
          reason = `parsed from deadline_summary: "${summary.slice(0, 50)}"`;
          stats.parsedFromSummary++;
        }
      }

      // 3. Fall back to institution-level rules
      if (!newDate) {
        const patch = applyRules(row);
        if (patch) {
          newDate = patch.nextDate;
          reason = `rule ${patch.rule_id}: ${patch.reason.slice(0, 80)}`;
          stats.filledByRule++;
        } else {
          stats.untouched++;
          continue;
        }
      }
    }

    updates.push({ id: row.id, application_close_date: newDate, _reason: reason, _country: row.country });
  }

  console.log('=== Proposed changes ===');
  console.log(`  already future (skipped)  : ${stats.alreadyFuture}`);
  console.log(`  rolled forward past → next: ${stats.rolledForward}`);
  console.log(`  parsed from summary       : ${stats.parsedFromSummary}`);
  console.log(`  filled by rule            : ${stats.filledByRule}`);
  console.log(`  still untouched           : ${stats.untouched}`);
  console.log(`  total updates staged      : ${updates.length}`);

  // Breakdown per country
  const byCountry = new Map();
  for (const u of updates) {
    if (!byCountry.has(u._country)) byCountry.set(u._country, 0);
    byCountry.set(u._country, byCountry.get(u._country) + 1);
  }
  console.log('\n  by country:');
  for (const [c, n] of [...byCountry.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${c}: ${n}`);
  }

  console.log('\n  sample updates (first 10):');
  updates.slice(0, 10).forEach((u) => console.log(`    ${u.application_close_date} | ${u.id.slice(0, 60)} | ${u._reason.slice(0, 60)}`));

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write changes.');
    return;
  }

  console.log('\nApplying updates to Supabase...');
  let done = 0;
  const BATCH = 200;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    // Use individual updates because upsert on programs would require reassembling full rows
    const promises = slice.map((u) =>
      supabase.from('programs').update({ application_close_date: u.application_close_date }).eq('id', u.id)
    );
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r.error) {
        console.error(`  error on update: ${r.error.message}`);
      }
    }
    done += slice.length;
    process.stdout.write(`  ${done}/${updates.length}\r`);
  }
  console.log(`\nDone. Updated ${done} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
