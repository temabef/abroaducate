import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('MISSING_SUPABASE_ENV', { url: !!url, key: !!key });
  process.exit(1);
}
const supabase = createClient(url, key);

// 1) Fetch programs currently marked scholarship_funded
const { data: fundedPrograms, error: fundedError } = await supabase
  .from('programs')
  .select('id, program_name, country, tuition_per_semester')
  .eq('tuition_tier', 'scholarship_funded');
if (fundedError) {
  console.error('ERROR_FETCH_FUNDED', fundedError);
  process.exit(1);
}
const fundedIds = (fundedPrograms || []).map((p) => p.id);
console.log('scholarship_funded_programs_count', fundedIds.length);

// 2) Fetch any matches that reference those programs
let matchedIds = [];
if (fundedIds.length > 0) {
  const { data: matches, error: matchError } = await supabase
    .from('program_scholarship_matches')
    .select('program_id')
    .in('program_id', fundedIds)
    .limit(10000);
  if (matchError) {
    console.error('ERROR_FETCH_MATCHES', matchError);
    process.exit(1);
  }
  matchedIds = [...new Set((matches || []).map((m) => m.program_id))];
}
console.log('matched_scholarship_funded_programs_count', matchedIds.length);

// 3) Identify funded programs without any matches
const matchedSet = new Set(matchedIds);
const withoutMatches = (fundedPrograms || []).filter((p) => !matchedSet.has(p.id));
console.log('funded_without_matches_count', withoutMatches.length);
console.log('sample_funded_without_matches', JSON.stringify(withoutMatches.slice(0, 20), null, 2));

process.exit(0);
