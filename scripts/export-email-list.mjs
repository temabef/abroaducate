/**
 * export-email-list.mjs
 *
 * Exports all registered users + newsletter subscribers as a CSV
 * for import into Customer.io (or any email platform).
 *
 * Usage:
 *   node scripts/export-email-list.mjs
 *
 * Output: email-list-export.csv in the project root
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Fetching registered users...');
  let users = [];
  let page = 1;
  while (true) {
    const { data: { users: batch }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error(error); process.exit(1); }
    if (!batch || batch.length === 0) break;
    users = [...users, ...batch];
    if (batch.length < 1000) break;
    page++;
  }
  console.log(`Found ${users.length} registered users`);

  console.log('Fetching newsletter subscribers...');
  let subscribers = [];
  let from = 0;
  while (true) {
    const { data: batch, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, source')
      .eq('status', 'active')
      .range(from, from + 999);
    if (error) { console.error(error); process.exit(1); }
    if (!batch || batch.length === 0) break;
    subscribers = [...subscribers, ...batch];
    if (batch.length < 1000) break;
    from += 1000;
  }
  console.log(`Found ${subscribers.length} newsletter subscribers`);

  // Deduplicate — registered users take priority
  const registeredEmails = new Set(users.map(u => u.email?.toLowerCase()).filter(Boolean));
  const newsletterOnly = subscribers.filter(s => !registeredEmails.has(s.email.toLowerCase()));
  console.log(`Newsletter-only (deduped): ${newsletterOnly.length}`);

  // Build combined list
  const rows = [
    // Header
    'email,type,source',
    // Registered users
    ...users
      .filter(u => u.email)
      .map(u => `${u.email},registered,platform`),
    // Newsletter-only
    ...newsletterOnly
      .map(s => `${s.email},newsletter,${s.source || 'newsletter'}`)
  ];

  const filename = 'email-list-export.csv';
  writeFileSync(filename, rows.join('\n'), 'utf8');

  console.log(`\n✅ Exported ${rows.length - 1} unique emails to ${filename}`);
  console.log('\nNext steps:');
  console.log('1. Go to Customer.io → People → Import');
  console.log('2. Upload email-list-export.csv');
  console.log('3. Map "email" column → Email field');
  console.log('4. Map "type" column → custom attribute "user_type"');
  console.log('5. After import, create a Campaign → Broadcast → send to all');
}

main().catch(console.error);
