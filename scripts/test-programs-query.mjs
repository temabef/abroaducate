import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

// Disable SSL verification for local testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 Testing programs query...\n');
console.log('Supabase URL:', process.env.PUBLIC_SUPABASE_URL);
console.log('');

// Test 1: Count total programs
console.log('Test 1: Count all programs');
const { count, error: countError } = await supabase
  .from('programs')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error('❌ Count failed:', countError);
} else {
  console.log('✅ Total programs in database:', count);
}
console.log('');

// Test 2: Fetch first 3 programs
console.log('Test 2: Fetch first 3 programs');
const { data, error } = await supabase
  .from('programs')
  .select('id, program_name, country')
  .limit(3);

if (error) {
  console.error('❌ Query failed:', error);
} else if (!data || data.length === 0) {
  console.log('⚠️  Query succeeded but returned 0 rows');
  console.log('   This usually means:');
  console.log('   1. RLS policy is blocking anonymous access');
  console.log('   2. Programs table is empty');
  console.log('   3. All programs have is_active = false');
} else {
  console.log('✅ Query succeeded!');
  console.log('   Sample programs:', data);
}
console.log('');

// Test 3: Check with service role key (bypasses RLS)
console.log('Test 3: Trying with service role key (bypasses RLS)');
const supabaseAdmin = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: adminData, error: adminError } = await supabaseAdmin
  .from('programs')
  .select('id, program_name, country, is_active')
  .limit(3);

if (adminError) {
  console.error('❌ Service role query failed:', adminError);
} else if (!adminData || adminData.length === 0) {
  console.log('⚠️  Even service role returned 0 rows');
  console.log('   Your programs table might be empty!');
} else {
  console.log('✅ Service role query succeeded!');
  console.log('   Sample programs:', adminData);
  console.log('');
  console.log('🎯 Diagnosis: RLS policy is blocking anonymous access');
  console.log('   Solution: Check programs table RLS policies in Supabase');
}
