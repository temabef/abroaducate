/**
 * Compute program ↔ scholarship matches and write them to
 * program_scholarship_matches.
 *
 * Usage:
 *   node scripts/match-scholarships-to-programs.js --dry-run
 *   node scripts/match-scholarships-to-programs.js --apply
 *   node scripts/match-scholarships-to-programs.js --apply --rollover-scholarships
 *
 * Scoring model (additive):
 *   +30  country matches (scholarship location contains program country)
 *   +25  institution-specific match (scholarship.university_name = program.university_name)
 *   +20  degree level matches (masters, bachelor, phd)
 *   +15  field matches (scholarship.field substring match, or 'All Fields')
 *   +10  nationality not restricted (or restrictions are empty)
 *    +5  scholarship deadline is >= program close date (student has time)
 *    +5  scholarship amount covers tuition (when program has tuition)
 *   -15  field mismatch (scholarship has a specific field that doesn't match)
 *   -20  scholarship deadline already past (future rollover advised)
 *
 * STRICT RULES:
 *   - broad_region (+15 for "Europe"/"Global") has been REMOVED. A scholarship
 *     must directly mention the program's country to qualify. A scholarship for
 *     Malta, Japan, or the US cannot fund a program in Germany.
 *   - Minimum score is 30 (requires at least a country match to qualify).
 *   - No TOP_N cap — if a program has 1 real match, show 1. If it has 8, show 8.
 *     Zero matches is acceptable and honest.
 *   - program_specific scholarships (Erasmus Mundus, joint degrees) require a
 *     genuine named-field match (not "All Fields") to qualify.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const ROLLOVER_SCHOLARSHIPS = process.argv.includes('--rollover-scholarships');
const PERSIST_ROLLOVER = process.argv.includes('--persist-rollover');
const TOP_N = 999; // No cap — show all genuine matches. Zero is acceptable and honest.
const SCORE_THRESHOLD = 70; // Requires country (30) + level (20) + field (15) + nationality/deadline (5+)
                             // This ensures only realistic, field-specific matches

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TODAY = new Date().toISOString().slice(0, 10);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchAll(table, columns) {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function rollForwardIso(dateStr, today = TODAY) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [ty, tmo, td] = today.split('-').map(Number);
  let year = y;
  while (true) {
    if (year > ty) return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (year === ty) {
      if (mo > tmo || (mo === tmo && d >= td)) return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    year += 1;
  }
}

function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

// Level normalisation for scoring
function matchesLevel(programLevel, scholarshipLevel, scholarshipLevelsArr) {
  const target = normalize(programLevel);
  const candidates = [];
  if (scholarshipLevel) candidates.push(normalize(scholarshipLevel));
  if (Array.isArray(scholarshipLevelsArr)) candidates.push(...scholarshipLevelsArr.map(normalize));
  const joined = candidates.join(' ');

  if (target === 'master' && /master/.test(joined)) return true;
  if (target === 'bachelor' && /bachelor|undergraduate/.test(joined)) return true;
  if (target === 'phd' && /phd|doctoral|doctorate/.test(joined)) return true;
  if (target === 'short_course' && /short|certificate|diploma/.test(joined)) return true;
  return false;
}

const BROAD_LOCATIONS = ['europe', 'eu', 'european union', 'multiple eu countries', 'global', 'worldwide', 'international', 'all'];

function matchesCountry(programCountry, scholarshipLocation) {
  if (!scholarshipLocation) return { direct: false, broad: false };
  const loc = normalize(scholarshipLocation);
  const c = normalize(programCountry);
  const direct = c && loc.includes(c);
  const broad = BROAD_LOCATIONS.some((b) => loc.includes(b));
  return { direct, broad };
}

function matchesField(programField, scholarshipField) {
  const pf = normalize(programField);
  const sf = normalize(scholarshipField);
  if (!sf) return false;
  
  // REJECT generic "All Fields" scholarships - they're too broad to be useful
  if (sf === 'all fields' || sf === 'all' || sf === 'various' || sf === 'any field') {
    return false;
  }
  
  if (!pf) return false;

  // Bidirectional substring match (at least 4 characters)
  if (sf.length >= 4 && pf.includes(sf)) return true;
  if (pf.length >= 4 && sf.includes(pf)) return true;

  // Keyword bucket matching — each side must fall into the same bucket.
  // Social/humanities listed before natural sciences so compound terms like
  // "social sciences" don't leak into the STEM bucket.
  const buckets = [
    ['engineering', 'engineer', 'mechanical', 'civil', 'electrical'],
    ['computer', 'computing', 'informatics', 'data', 'artificial intelligence', 'software', 'cyber'],
    ['business', 'management', 'finance', 'economics', 'marketing', 'accounting', 'mba'],
    ['health', 'medicine', 'medical', 'pharmacy', 'nursing', 'dental', 'veterinary'],
    ['political', 'humanities', 'sociology', 'philosophy', 'history', 'social science'],
    ['physics', 'chemistry', 'biology', 'mathematics', 'stem', 'natural science'],
    ['arts', 'design', 'fashion', 'architecture', 'music', 'film'],
    ['law', 'llm', 'legal'],
    ['environment', 'ecology', 'sustainability', 'agriculture', 'agronomy']
  ];

  let pBucket = -1;
  let sBucket = -1;
  for (let i = 0; i < buckets.length; i++) {
    const keywords = buckets[i];
    if (pBucket === -1 && keywords.some((k) => pf.includes(k))) pBucket = i;
    if (sBucket === -1 && keywords.some((k) => sf.includes(k))) sBucket = i;
    if (pBucket !== -1 && sBucket !== -1) break;
  }
  if (pBucket !== -1 && sBucket !== -1 && pBucket === sBucket) return true;
  return false;
}

// Detect whether the scholarship amount covers tuition, living, travel
function parseCovers(amount, type, description) {
  const text = normalize(`${amount || ''} ${type || ''} ${description || ''}`);
  const covers = [];
  if (/full|fully.funded|full.funding/.test(text)) covers.push('tuition', 'living');
  if (/tuition/.test(text)) covers.push('tuition');
  if (/stipend|living|monthly|allowance/.test(text)) covers.push('living');
  if (/travel/.test(text)) covers.push('travel');
  if (/insurance|health.insurance/.test(text)) covers.push('insurance');
  return [...new Set(covers)];
}

// ── Scholarship classification ───────────────────────────────────────────────
// Erasmus Mundus and joint-degree programs are NOT open scholarships.
// They are specific degree programs that happen to include funding.
// Matching them against unrelated programs misleads students.
// We detect them by title/description and apply much stricter rules.

function classifyScholarship(scholarship) {
  const text = `${scholarship.title || ''} ${scholarship.description || ''}`.toLowerCase();
  const isErasmusMundus =
    text.includes('erasmus mundus') ||
    text.includes('emjmd') ||
    text.includes('emjm') ||
    text.includes('joint master') ||
    text.includes('joint degree') ||
    text.includes('joint masters');
  // DAAD Double Degree is also program-specific
  const isDoubleDegreeProgramSpecific =
    text.includes('double degree') && text.includes('daad');
  return isErasmusMundus || isDoubleDegreeProgramSpecific
    ? 'program_specific'
    : 'open';
}

function scoreMatch(program, scholarship) {
  const rules = [];
  let score = 0;

  // Classify the scholarship: 'program_specific' (Erasmus Mundus, joint degrees)
  // or 'open' (DAAD, government grants, foundation awards).
  // Program-specific scholarships are tied to a specific degree — they must
  // have a strong field match to be shown, otherwise they mislead students.
  const scholarshipClass = classifyScholarship(scholarship);

  // 1. MANDATORY: Country — STRICT: scholarship must directly name the program's country.
  const { direct } = matchesCountry(program.country, scholarship.location);
  if (direct) {
    score += 30;
    rules.push('country');
  } else {
    // No country match = this scholarship cannot fund this program.
    return { score: 0, rules: ['no_country_match'], covers: [] };
  }

  // 2. Institution-specific (highest confidence)
  if (
    scholarship.university_name &&
    program.university_name &&
    normalize(scholarship.university_name) === normalize(program.university_name)
  ) {
    score += 25;
    rules.push('institution');
  }

  // 3. MANDATORY: Level
  if (matchesLevel(program.degree_level, scholarship.level, scholarship.levels)) {
    score += 20;
    rules.push('level');
  } else {
    // Level mismatch = cannot fund this program
    return { score: 0, rules: ['level_mismatch'], covers: [] };
  }

  // 4. MANDATORY: Field
  const fieldMatch = matchesField(program.field_of_study, scholarship.field);
  if (fieldMatch) {
    score += 15;
    rules.push('field');
  } else {
    // No field match = not eligible
    // This rejects "All Fields" scholarships AND field mismatches
    return { score: 0, rules: ['field_mismatch_or_too_broad'], covers: [] };
  }

  // Program-specific penalty: Erasmus Mundus / joint-degree scholarships are
  // tied to a specific degree program. Even if their DB field says "All Fields"
  // (which is often wrong for Erasmus Mundus), they are NOT open scholarships.
  // Apply a hard disqualifying penalty so they never surface for wrong fields.
  if (scholarshipClass === 'program_specific') {
    // For program-specific scholarships, "All Fields" in the DB is unreliable —
    // Erasmus Mundus programs always have a specific field. Treat it as no match.
    const scholarshipFieldIsAllFields = !scholarship.field || normalize(scholarship.field) === 'all fields';
    const genuineFieldMatch = fieldMatch && !scholarshipFieldIsAllFields;

    if (!genuineFieldMatch) {
      score -= 40;
      rules.push('program_specific_field_mismatch');
    } else {
      rules.push('program_specific');
    }
  }

  // 5. Nationality
  const restrictions = Array.isArray(scholarship.nationality_restrictions)
    ? scholarship.nationality_restrictions
    : [];
  if (restrictions.length === 0) {
    score += 10;
    rules.push('nationality_open');
  }

  // 6. Deadline viability (scholarship deadline must be reachable before program close)
  if (scholarship.deadline && program.application_close_date) {
    if (scholarship.deadline <= program.application_close_date) {
      score += 5;
      rules.push('deadline_viable');
    }
  }

  // 7. Covers tuition where program has tuition
  const covers = parseCovers(scholarship.amount, scholarship.type, scholarship.description);
  if ((program.tuition_per_semester || 0) > 0 && covers.includes('tuition')) {
    score += 5;
    rules.push('tuition_covered');
  }

  // 8. Past deadline penalty
  if (scholarship.deadline && scholarship.deadline < TODAY) {
    score -= 20;
    rules.push('deadline_past');
  }

  return { score, rules, covers };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}`);
  console.log(`Today: ${TODAY}`);
  console.log(`Rollover scholarship deadlines: ${ROLLOVER_SCHOLARSHIPS ? 'yes' : 'no'}`);

  // Pre-flight: if --apply was passed, verify the migration has been applied.
  if (APPLY) {
    const tierProbe = await supabase.from('programs').select('id, tuition_tier').limit(1);
    const matchProbe = await supabase.from('program_scholarship_matches').select('program_id').limit(1);
    if (tierProbe.error || matchProbe.error) {
      console.error('\n❌ Migration not applied.');
      console.error('   Run supabase/migrations/20260510000001_scholarship_matching.sql in the Supabase SQL Editor first.');
      if (tierProbe.error) console.error('   - programs.tuition_tier missing:', tierProbe.error.message);
      if (matchProbe.error) console.error('   - program_scholarship_matches missing:', matchProbe.error.message);
      process.exit(1);
    }
  }

  const programs = await fetchAll(
    'programs',
    'id, country, university_name, program_name, degree_level, field_of_study, tuition_per_semester, application_close_date'
  );
  const rawScholarships = await fetchAll(
    'scholarships',
    'id, title, provider, university_name, location, level, levels, field, amount, deadline, type, description, nationality_restrictions, is_active'
  );

  console.log(`Programs: ${programs.length}`);
  console.log(`Scholarships: ${rawScholarships.length}`);

  // Prep scholarships: optionally roll deadlines forward, filter actives
  const rolledScholarships = [];
  const scholarships = rawScholarships
    .filter((s) => s.is_active)
    .map((s) => {
      const s2 = { ...s };
      if (ROLLOVER_SCHOLARSHIPS && s.deadline && s.deadline < TODAY) {
        const rolled = rollForwardIso(s.deadline);
        if (rolled && rolled !== s.deadline) {
          s2.deadline = rolled;
          rolledScholarships.push({ id: s.id, old: s.deadline, new: rolled });
        }
      }
      return s2;
    });

  if (ROLLOVER_SCHOLARSHIPS) {
    console.log(`Rolled ${rolledScholarships.length} scholarship deadlines forward to next occurrence.`);
  }

  console.log(`Active scholarships: ${scholarships.length}`);
  console.log(
    `Scholarships with future deadline: ${scholarships.filter((s) => s.deadline && s.deadline >= TODAY).length}`
  );

  // Build match set
  console.log('\nScoring matches...');
  let totalCandidates = 0;
  let totalKept = 0;
  let programsWithMatches = 0;
  const matchRows = [];

  for (const p of programs) {
    const scored = [];
    for (const s of scholarships) {
      const { score, rules, covers } = scoreMatch(p, s);
      if (score >= SCORE_THRESHOLD) {
        scored.push({
          program_id: p.id,
          scholarship_id: s.id,
          score,
          match_rules: rules,
          covers,
          _title: s.title,
          _provider: s.provider
        });
      }
      totalCandidates++;
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_N);
    top.forEach((m, i) => (m.rank_in_program = i + 1));
    if (top.length > 0) programsWithMatches++;
    totalKept += top.length;
    matchRows.push(...top);
  }

  console.log(`Candidates evaluated: ${totalCandidates}`);
  console.log(`Kept (top ${TOP_N} per program): ${totalKept}`);
  console.log(`Programs with >=1 match: ${programsWithMatches}/${programs.length}`);

  // Distribution of matches per country
  const byCountry = new Map();
  for (const p of programs) {
    if (!byCountry.has(p.country)) byCountry.set(p.country, { programs: 0, matched: 0 });
    byCountry.get(p.country).programs += 1;
  }
  const matchedProgramIds = new Set(matchRows.map((m) => m.program_id));
  for (const id of matchedProgramIds) {
    const p = programs.find((x) => x.id === id);
    if (p) byCountry.get(p.country).matched += 1;
  }
  console.log('\nMatch coverage by country:');
  for (const [c, b] of [...byCountry.entries()].sort((a, b) => b[1].programs - a[1].programs)) {
    const pct = Math.round((b.matched / b.programs) * 100);
    console.log(`  ${c.padEnd(16)} ${b.matched}/${b.programs} programs have matches (${pct}%)`);
  }

  // Sample top matches
  console.log('\nSample top matches:');
  matchRows.slice(0, 10).forEach((m) => {
    console.log(`  score=${m.score} | ${m._title?.slice(0, 40)} → ${m.program_id.slice(0, 50)} [${m.match_rules.join(',')}]`);
  });

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write to program_scholarship_matches.');
    return;
  }

  // Optionally persist rolled-forward deadlines back to the scholarships table so
  // the public-facing data is also up to date.
  if (APPLY && PERSIST_ROLLOVER && rolledScholarships.length > 0) {
    console.log(`\nPersisting ${rolledScholarships.length} rolled scholarship deadlines to the scholarships table...`);
    let pushed = 0;
    for (const r of rolledScholarships) {
      const { error } = await supabase.from('scholarships').update({ deadline: r.new, deadline_recurrence: 'annual' }).eq('id', r.id);
      if (!error) pushed += 1;
    }
    console.log(`  updated ${pushed}/${rolledScholarships.length}`);
  }

  // Clear existing matches and insert fresh
  console.log('\nClearing existing matches...');
  const { error: delErr } = await supabase.from('program_scholarship_matches').delete().neq('program_id', '__impossible__');
  if (delErr) {
    console.error('Delete failed (table might not exist yet — run the migration):', delErr.message);
    process.exit(1);
  }

  console.log('Inserting new matches...');
  const BATCH = 500;
  let inserted = 0;
  const rowsToInsert = matchRows.map((m) => ({
    program_id: m.program_id,
    scholarship_id: m.scholarship_id,
    score: m.score,
    match_rules: m.match_rules,
    covers: m.covers,
    rank_in_program: m.rank_in_program
  }));

  for (let i = 0; i < rowsToInsert.length; i += BATCH) {
    const batch = rowsToInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('program_scholarship_matches').insert(batch);
    if (error) {
      console.error('Insert batch failed:', error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`  ${inserted}/${rowsToInsert.length}\r`);
  }
  console.log(`\nInserted ${inserted} match rows.`);

  // Bump tuition_tier on programs that have a scholarship match
  console.log('\nPromoting programs with matches to scholarship_funded tier...');
  const programsToPromote = programs.filter((p) => matchedProgramIds.has(p.id));
  console.log(`  ${programsToPromote.length} programs have matches — promoting`);

  let promoted = 0;
  for (const p of programsToPromote) {
    const { error } = await supabase
      .from('programs')
      .update({ tuition_tier: 'scholarship_funded' })
      .eq('id', p.id);
    if (!error) promoted += 1;
  }
  console.log(`  promoted ${promoted} programs to scholarship_funded.`);

  // Demote programs that were previously scholarship_funded but no longer have
  // any active scholarship matches.
  console.log('Demoting stale scholarship_funded programs...');
  const currentlyFunded = programs.filter((p) => p.tuition_tier === 'scholarship_funded');
  let demoted = 0;
  for (const p of currentlyFunded) {
    if (!matchedProgramIds.has(p.id)) {
      const tuition = p.tuition_per_semester || 0;
      const newTier = tuition === 0 ? 'zero_tuition' : tuition <= 5000 ? 'low_tuition' : 'paid';
      const { error } = await supabase
        .from('programs')
        .update({ tuition_tier: newTier })
        .eq('id', p.id);
      if (!error) demoted += 1;
    }
  }
  console.log(`  demoted ${demoted} stale scholarship_funded programs.`);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
