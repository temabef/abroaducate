import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('MISSING_SUPABASE_ENV', { url: !!url, key: !!key });
  process.exit(1);
}
const supabase = createClient(url, key);

const programId = 'lithuania-vilnius-university-dentistry-vilnius-master-programs-dentistry';

const { data, error } = await supabase
  .from('public_program_scholarship_matches')
  .select('*')
  .eq('program_id', programId)
  .order('rank_in_program', { ascending: true });

if (error) {
  console.error('ERROR_FETCH_VIEW', error);
  process.exit(1);
}
console.log('public_program_scholarship_matches_count', (data || []).length);
console.log(JSON.stringify((data || []).slice(0, 10), null, 2));
process.exit(0);
