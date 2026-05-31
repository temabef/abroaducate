/**
 * sync-users-to-customerio.mjs
 *
 * Syncs all registered users + newsletter subscribers to Customer.io
 * so you can send a broadcast campaign to everyone from the Customer.io dashboard.
 *
 * Usage:
 *   node scripts/sync-users-to-customerio.mjs --dry-run   (preview counts)
 *   node scripts/sync-users-to-customerio.mjs --apply     (actually sync)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const isApply = process.argv.includes('--apply');

if (!isDryRun && !isApply) {
  console.error('Usage: node scripts/sync-users-to-customerio.mjs --dry-run | --apply');
  process.exit(1);
}

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CIO_SITE_ID = process.env.CUSTOMER_IO_SITE_ID;
const CIO_API_KEY = process.env.CUSTOMER_IO_API_KEY;

if (!CIO_SITE_ID || !CIO_API_KEY) {
  console.error('Missing CUSTOMER_IO_SITE_ID or CUSTOMER_IO_API_KEY in .env');
  process.exit(1);
}

// Customer.io Track API base URL (EU region)
const CIO_TRACK_URL = 'https://track-eu.customer.io/api/v1';

async function identifyInCio(id, email, attributes = {}) {
  const res = await fetch(`${CIO_TRACK_URL}/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, ...attributes })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CIO identify failed for ${email}: ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}\n`);

  // --- 1. Fetch all registered users ---
  console.log('Fetching registered users from Supabase auth...');
  let users = [];
  let page = 1;
  while (true) {
    const { data: { users: batch }, error: usersErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersErr) { console.error('Error fetching users:', usersErr); process.exit(1); }
    if (!batch || batch.length === 0) break;
    users = [...users, ...batch];
    if (batch.length < 1000) break;
    page++;
  }
  console.log(`Found ${users.length} registered users`);

  // --- 2. Fetch all newsletter subscribers ---
  console.log('Fetching newsletter subscribers...');
  let subscribers = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data: batch, error: subErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, source, status')
      .eq('status', 'active')
      .range(from, from + PAGE - 1);
    if (subErr) { console.error('Error fetching subscribers:', subErr); process.exit(1); }
    if (!batch || batch.length === 0) break;
    subscribers = [...subscribers, ...batch];
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  console.log(`Found ${subscribers.length} active newsletter subscribers`);

  // --- 3. Deduplicate ---
  const registeredEmails = new Set(users.map(u => u.email?.toLowerCase()).filter(Boolean));
  const newsletterOnly = subscribers.filter(s => !registeredEmails.has(s.email.toLowerCase()));
  console.log(`Newsletter-only (not registered): ${newsletterOnly.length}`);
  console.log(`Total unique people to sync: ${users.length + newsletterOnly.length}\n`);

  if (isDryRun) {
    console.log('--- DRY RUN COMPLETE ---');
    console.log(`Would sync ${users.length} registered users to Customer.io`);
    console.log(`Would sync ${newsletterOnly.length} newsletter-only subscribers to Customer.io`);
    console.log('\nRe-run with --apply to actually sync.');
    return;
  }

  // --- 4. Sync registered users ---
  console.log(`\nSyncing ${users.length} registered users to Customer.io...`);
  let regSuccess = 0, regFail = 0;
  for (const user of users) {
    if (!user.email) continue;
    try {
      await identifyInCio(user.id, user.email, {
        user_type: 'registered',
        created_at: Math.floor(new Date(user.created_at).getTime() / 1000)
      });
      regSuccess++;
      if (regSuccess % 100 === 0) console.log(`  Synced ${regSuccess}/${users.length} registered users...`);
    } catch (e) {
      regFail++;
      console.error(`  Failed: ${user.email} — ${e.message}`);
    }
    // Rate limit: ~100 req/s, add small delay every 50
    if (regSuccess % 50 === 0) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`Registered users: ${regSuccess} synced, ${regFail} failed`);

  // --- 5. Sync newsletter-only subscribers ---
  console.log(`\nSyncing ${newsletterOnly.length} newsletter subscribers to Customer.io...`);
  let subSuccess = 0, subFail = 0;
  for (const sub of newsletterOnly) {
    try {
      // Use email as ID for newsletter subscribers (they have no user ID)
      await identifyInCio(`newsletter_${sub.id}`, sub.email, {
        user_type: 'newsletter_subscriber',
        source: sub.source || 'newsletter'
      });
      subSuccess++;
      if (subSuccess % 100 === 0) console.log(`  Synced ${subSuccess}/${newsletterOnly.length} subscribers...`);
    } catch (e) {
      subFail++;
      console.error(`  Failed: ${sub.email} — ${e.message}`);
    }
    if (subSuccess % 50 === 0) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`Newsletter subscribers: ${subSuccess} synced, ${subFail} failed`);

  console.log('\n--- SYNC COMPLETE ---');
  console.log(`Total synced to Customer.io: ${regSuccess + subSuccess}`);
  console.log('\nNext step: Go to Customer.io → Campaigns → New Campaign → Broadcast');
  console.log('Select all people → compose your launch email → send.');
}

main().catch(console.error);
