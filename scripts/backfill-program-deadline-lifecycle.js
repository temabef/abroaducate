/**
 * Backfill deadline lifecycle metadata for every program.
 *
 * This does not require a schema migration. It stores metadata inside
 * programs.rubric_criteria.deadline_lifecycle so the platform can distinguish
 * active, expired, rolling, estimated, and not-yet-published deadlines.
 *
 * Usage:
 *   node scripts/backfill-program-deadline-lifecycle.js --dry-run
 *   node scripts/backfill-program-deadline-lifecycle.js --apply
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const APPLY = process.argv.includes('--apply');
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  return dateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate())));
}

function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function hasUnpublishedDeadline(summary) {
  return /check official|not published|not yet|tbd|to be announced|varies|unknown/i.test(summary);
}

function classifyDeadline(program, today = new Date()) {
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const summary = String(program.deadline_summary || '').trim();
  const closeDate = parseDateOnly(program.application_close_date);

  if (closeDate) {
    const expired = closeDate < todayUtc;
    return {
      status: expired ? 'expired' : 'verified',
      cycle_year: closeDate.getUTCFullYear(),
      sort_date: dateOnly(closeDate),
      display_label: expired
        ? `Closed for ${closeDate.getUTCFullYear()} intake. Next deadline not yet verified.`
        : dateOnly(closeDate),
      source: program.official_source_url || program.direct_application_url || null,
      last_evaluated_date: dateOnly(todayUtc),
      next_refresh_due: expired ? dateOnly(todayUtc) : addMonths(closeDate, 1)
    };
  }

  if (/rolling/i.test(summary)) {
    return {
      status: 'rolling',
      cycle_year: null,
      sort_date: null,
      display_label: 'Rolling admission. Confirm current availability on the official page.',
      source: program.official_source_url || program.direct_application_url || null,
      last_evaluated_date: dateOnly(todayUtc),
      next_refresh_due: addMonths(todayUtc, 3)
    };
  }

  if (!summary || hasUnpublishedDeadline(summary)) {
    return {
      status: 'not_published',
      cycle_year: null,
      sort_date: null,
      display_label: 'Deadline not published yet. Check the official program page.',
      source: program.official_source_url || program.direct_application_url || null,
      last_evaluated_date: dateOnly(todayUtc),
      next_refresh_due: addMonths(todayUtc, 3)
    };
  }

  return {
    status: 'estimated',
    cycle_year: null,
    sort_date: null,
    display_label: summary,
    source: program.official_source_url || program.direct_application_url || null,
    last_evaluated_date: dateOnly(todayUtc),
    next_refresh_due: addMonths(todayUtc, 6)
  };
}

async function fetchAllPrograms() {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('programs')
      .select('id,country,application_close_date,deadline_summary,official_source_url,direct_application_url,rubric_criteria')
      .range(from, from + pageSize - 1)
      .order('id');

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function main() {
  const programs = await fetchAllPrograms();
  const updatedRows = programs.map((program) => ({
    id: program.id,
    country: program.country,
    lifecycle: classifyDeadline(program),
    rubric_criteria: {
      ...(program.rubric_criteria && typeof program.rubric_criteria === 'object' ? program.rubric_criteria : {}),
      deadline_lifecycle: classifyDeadline(program)
    }
  }));

  const counts = updatedRows.reduce((acc, row) => {
    acc[row.lifecycle.status] = (acc[row.lifecycle.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Mode: ${APPLY ? 'apply' : 'dry-run'}`);
  console.log(`Programs scanned: ${programs.length}`);
  console.log('Deadline lifecycle counts:', counts);

  const dueForRefresh = updatedRows.filter((row) => row.lifecycle.status === 'expired' || row.lifecycle.status === 'not_published').length;
  console.log(`Due for refresh now: ${dueForRefresh}`);

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to update rubric_criteria.deadline_lifecycle.');
    return;
  }

  let updated = 0;
  for (const row of updatedRows) {
    const { error } = await supabase
      .from('programs')
      .update({ rubric_criteria: row.rubric_criteria })
      .eq('id', row.id);

    if (error) throw error;
    updated++;
  }

  console.log(`Updated ${updated} programs with deadline lifecycle metadata.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
