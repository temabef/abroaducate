/**
 * POST-DEPLOY CREDIT INITIALISATION
 * ===================================
 * Run this ONCE after deploying the new platform to production.
 *
 * What it does:
 *   1. Gives every existing auth user 3 free credits (lifetime, not monthly)
 *      — skips users who already have a user_profiles row
 *   2. Gives Faith Rotich (mouzesrotich@gmail.com) 500 credits as a
 *      thank-you for being a paying subscriber on the old platform
 *
 * Usage:
 *   node scripts/post-deploy-credits.mjs --dry-run   (preview, no writes)
 *   node scripts/post-deploy-credits.mjs --apply     (write to DB)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const FREE_CREDITS = 3;
const FAITH_EMAIL = 'mouzesrotich@gmail.com';
const FAITH_CREDITS = 500;

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
console.log('---');

// ── 1. Fetch all auth users (paginated) ─────────────────────────────────────
console.log('Fetching all auth users...');
let allUsers = [];
let page = 1;
while (true) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error('listUsers error:', error); process.exit(1); }
  if (!users || users.length === 0) break;
  allUsers.push(...users);
  if (users.length < 1000) break;
  page++;
}
console.log(`Total auth users: ${allUsers.length}`);

// ── 2. Fetch existing user_profiles rows ────────────────────────────────────
const { data: existingProfiles } = await supabase
  .from('user_profiles')
  .select('user_id, credits');
const existingSet = new Set((existingProfiles || []).map(p => p.user_id));
console.log(`Existing user_profiles rows: ${existingSet.size}`);

// ── 3. Find Faith ────────────────────────────────────────────────────────────
const faith = allUsers.find(u => u.email?.toLowerCase() === FAITH_EMAIL.toLowerCase());
if (!faith) {
  console.warn(`⚠️  Faith (${FAITH_EMAIL}) not found in auth.users — skipping her special credit`);
} else {
  console.log(`Faith found: ${faith.id} (${faith.email})`);
}

// ── 4. Build insert rows for users without a profile ────────────────────────
const toInsert = [];
for (const user of allUsers) {
  if (existingSet.has(user.id)) continue; // already has a profile row
  const isFaith = user.id === faith?.id;
  toInsert.push({
    user_id: user.id,
    credits: isFaith ? FAITH_CREDITS : FREE_CREDITS
  });
}

// If Faith already has a profile row, update her credits separately
const faithAlreadyHasProfile = faith && existingSet.has(faith.id);

console.log(`\nUsers to create profiles for: ${toInsert.length}`);
console.log(`  - Regular users (${FREE_CREDITS} credits each): ${toInsert.filter(r => r.credits === FREE_CREDITS).length}`);
console.log(`  - Faith (${FAITH_CREDITS} credits): ${toInsert.filter(r => r.credits === FAITH_CREDITS).length}`);
if (faithAlreadyHasProfile) {
  const faithProfile = existingProfiles.find(p => p.user_id === faith.id);
  console.log(`  - Faith already has a profile (credits: ${faithProfile?.credits}) — will update to ${FAITH_CREDITS}`);
}

if (!APPLY) {
  console.log('\nDry run complete. Re-run with --apply to write to DB.');
  process.exit(0);
}

// ── 5. Insert in batches of 500 ──────────────────────────────────────────────
const BATCH = 500;
let inserted = 0;
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH);
  const { error } = await supabase.from('user_profiles').insert(batch);
  if (error) {
    console.error(`Batch insert failed at offset ${i}:`, error.message);
    process.exit(1);
  }
  inserted += batch.length;
  process.stdout.write(`  Inserted ${inserted}/${toInsert.length}\r`);
}
console.log(`\n✅ Created ${inserted} user_profiles rows`);

// ── 6. Update Faith's credits if she already had a profile ──────────────────
if (faithAlreadyHasProfile && faith) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ credits: FAITH_CREDITS })
    .eq('user_id', faith.id);
  if (error) console.error('Failed to update Faith credits:', error.message);
  else console.log(`✅ Updated Faith's credits to ${FAITH_CREDITS}`);
}

// ── 7. Log credit_transactions for audit trail ───────────────────────────────
const txRows = toInsert.map(r => ({
  user_id: r.user_id,
  amount: r.credits,
  action_type: r.credits === FAITH_CREDITS ? 'LEGACY_SUBSCRIBER_TOPUP' : 'SIGNUP_BONUS'
}));
if (faithAlreadyHasProfile && faith) {
  txRows.push({ user_id: faith.id, amount: FAITH_CREDITS, action_type: 'LEGACY_SUBSCRIBER_TOPUP' });
}

for (let i = 0; i < txRows.length; i += BATCH) {
  const batch = txRows.slice(i, i + BATCH);
  await supabase.from('credit_transactions').insert(batch);
}
console.log(`✅ Logged ${txRows.length} credit transactions`);

console.log('\n✅ Post-deploy credit initialisation complete.');
console.log(`   ${allUsers.length} users processed`);
console.log(`   ${inserted} new profiles created (${FREE_CREDITS} credits each)`);
if (faith) console.log(`   Faith Rotich: ${FAITH_CREDITS} credits`);
